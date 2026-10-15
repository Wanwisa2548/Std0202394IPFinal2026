// Load backend/.env if present (DB_* settings, PORT). Missing file is fine.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { initRepository } = require('./repository');

const app = express();
// 3000 by default; set PORT=3038 in .env on the university server.
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

// Storage repository (MySQL or in-memory fallback); assigned in start().
let repo;

// Column limits from the MySQL table: VARCHAR(100), DECIMAL(12,2).
const MAX_TEXT_LENGTH = 100;
const MAX_SALARY = 9999999999.99;

const VALID_CREDENTIALS = { username: 'admin', password: 'password123' };
const MOCK_TOKEN = 'mock-jwt-token';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * Converts a salary input with Number() and checks that it is a valid positive number.
 * Returns the number, or null if invalid.
 */
const parseSalary = (value) => {
  // Only accept numbers or non-empty strings; Number('') / Number(true) / Number([5])
  // would otherwise silently become 0 / 1 / 5.
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (isNonEmptyString(value)) {
    const n = Number(value.trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
};

/**
 * 1D K-Means clustering implemented from scratch.
 * - k is capped at the number of unique salaries.
 * - Centroids are initialised deterministically from the sorted unique salaries
 *   (for k = 3: min, median, max), so they always start distinct.
 * - An empty cluster keeps its previous centroid.
 * - Stops on convergence (no assignment change) or after maxIterations.
 */
const kMeans1D = (values, k = 3, maxIterations = 100) => {
  if (!Array.isArray(values) || values.length === 0) return [];

  const sortedUnique = [...new Set(values)].sort((a, b) => a - b);
  const effectiveK = Math.min(k, sortedUnique.length);
  if (effectiveK === 0) return [];

  // Deterministic init: evenly spaced picks over unique sorted values.
  // effectiveK = 3 -> min, median, max; 2 -> min, max; 1 -> the single value.
  let centroids = [];
  for (let i = 0; i < effectiveK; i++) {
    const idx = effectiveK === 1 ? 0 : Math.round((i * (sortedUnique.length - 1)) / (effectiveK - 1));
    centroids.push(sortedUnique[idx]);
  }

  let assignments = new Array(values.length).fill(-1);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assignment step: nearest centroid (ties go to the lower index).
    let changed = false;
    const newAssignments = values.map((v) => {
      let best = 0;
      let bestDist = Math.abs(v - centroids[0]);
      for (let c = 1; c < centroids.length; c++) {
        const d = Math.abs(v - centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      return best;
    });
    for (let i = 0; i < values.length; i++) {
      if (newAssignments[i] !== assignments[i]) {
        changed = true;
        break;
      }
    }
    assignments = newAssignments;

    // Update step: mean of members; empty cluster keeps previous centroid.
    const sums = new Array(effectiveK).fill(0);
    const counts = new Array(effectiveK).fill(0);
    values.forEach((v, i) => {
      sums[assignments[i]] += v;
      counts[assignments[i]] += 1;
    });
    centroids = centroids.map((prev, c) => (counts[c] > 0 ? sums[c] / counts[c] : prev));

    if (!changed) break;
  }

  const counts = new Array(effectiveK).fill(0);
  assignments.forEach((a) => {
    counts[a] += 1;
  });

  return centroids
    .map((centroid, c) => ({ centroid, count: counts[c] }))
    .sort((a, b) => a.centroid - b.centroid)
    .map((cluster, i) => ({
      group: `Tier ${i + 1}`,
      centroid: Math.round(cluster.centroid),
      count: cluster.count,
    }));
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// 1. Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
    return res.status(200).json({ success: true, token: MOCK_TOKEN });
  }
  return res.status(401).json({ success: false, message: 'Invalid username or password' });
});

// Storage mode check (handy to confirm MySQL vs in-memory)
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, storage: repo.mode });
});

// 2. Get all employees
app.get('/api/employees', async (req, res) => {
  const employees = await repo.getAll();
  res.status(200).json(employees);
});

// 6. Salary clusters — registered BEFORE any /api/employees/:id routes.
app.get('/api/employees/salary-clusters', async (req, res) => {
  const salaries = (await repo.getSalaries()).filter((s) => Number.isFinite(s));

  if (salaries.length === 0) {
    return res.status(200).json({ success: true, clusters: [] });
  }

  const clusters = kMeans1D(salaries, 3, 100);
  return res.status(200).json({ success: true, clusters });
});

// 3. Add employee
app.post('/api/employees', async (req, res) => {
  const { name, position, salary } = req.body || {};

  const missing = [];
  if (!isNonEmptyString(name)) missing.push('name');
  if (!isNonEmptyString(position)) missing.push('position');
  if (salary === undefined || salary === null || (typeof salary === 'string' && salary.trim() === '')) {
    missing.push('salary');
  }
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing or empty required field(s): ${missing.join(', ')}`,
    });
  }

  const parsedSalary = parseSalary(salary);
  if (parsedSalary === null) {
    return res.status(400).json({
      success: false,
      message: 'Salary must be a valid positive number',
    });
  }
  if (parsedSalary > MAX_SALARY) {
    return res.status(400).json({
      success: false,
      message: `Salary must not exceed ${MAX_SALARY}`,
    });
  }

  const trimmedName = name.trim();
  const trimmedPosition = position.trim();
  if (trimmedName.length > MAX_TEXT_LENGTH || trimmedPosition.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Name and position must be at most ${MAX_TEXT_LENGTH} characters`,
    });
  }

  const newEmployee = await repo.create({
    name: trimmedName,
    position: trimmedPosition,
    salary: parsedSalary,
  });
  return res.status(201).json(newEmployee);
});

// 4. Toggle status
app.put('/api/employees/:id/status', async (req, res) => {
  const employee = await repo.toggleStatus(req.params.id);
  if (!employee) {
    return res.status(404).json({ success: false, message: `Employee with id ${req.params.id} not found` });
  }
  return res.status(200).json(employee);
});

// 5. Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  const deleted = await repo.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: `Employee with id ${req.params.id} not found` });
  }
  return res.status(200).json({ success: true });
});

// ---------------------------------------------------------------------------
// 404 + global error handler
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
});

async function start() {
  repo = await initRepository();
  app.listen(PORT, HOST, () => {
    console.log(`HR Manager API running at http://${HOST}:${PORT} (storage: ${repo.mode})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
