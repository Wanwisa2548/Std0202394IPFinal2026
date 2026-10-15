const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// In-memory data store (no database)
// ---------------------------------------------------------------------------
let employees = [
  { id: '1', name: 'John Doe', position: 'Software Engineer', status: 'Active', salary: 45000 },
  { id: '2', name: 'Jane Smith', position: 'HR Assistant', status: 'Active', salary: 18000 },
  { id: '3', name: 'Somchai Jaidee', position: 'Office Clerk', status: 'On Leave', salary: 15000 },
  { id: '4', name: 'Emily Brown', position: 'Receptionist', status: 'Active', salary: 21000 },
  { id: '5', name: 'Michael Lee', position: 'Senior Developer', status: 'Active', salary: 52000 },
  { id: '6', name: 'Sarah Wilson', position: 'Project Manager', status: 'Active', salary: 48000 },
  { id: '7', name: 'David Kim', position: 'Engineering Director', status: 'Active', salary: 95000 },
  { id: '8', name: 'Anna Chen', position: 'Chief Technology Officer', status: 'On Leave', salary: 120000 },
  { id: '9', name: 'Peter Parker', position: 'Data Analyst', status: 'Active', salary: 40000 },
  { id: '10', name: 'Lisa Wong', position: 'Support Staff', status: 'Active', salary: 20000 },
];

// Next id counter; ids are unique strings and are never reused after a delete.
let nextId = employees.length + 1;
const generateId = () => String(nextId++);

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

const findEmployeeIndex = (id) => employees.findIndex((e) => e.id === id);

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

// 2. Get all employees
app.get('/api/employees', (req, res) => {
  res.status(200).json(employees);
});

// 6. Salary clusters — registered BEFORE any /api/employees/:id routes.
app.get('/api/employees/salary-clusters', (req, res) => {
  const salaries = employees
    .map((e) => Number(e.salary))
    .filter((s) => Number.isFinite(s));

  if (salaries.length === 0) {
    return res.status(200).json({ success: true, clusters: [] });
  }

  const clusters = kMeans1D(salaries, 3, 100);
  return res.status(200).json({ success: true, clusters });
});

// 3. Add employee
app.post('/api/employees', (req, res) => {
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

  const newEmployee = {
    id: generateId(),
    name: name.trim(),
    position: position.trim(),
    status: 'Active',
    salary: parsedSalary,
  };
  employees.push(newEmployee);
  return res.status(201).json(newEmployee);
});

// 4. Toggle status
app.put('/api/employees/:id/status', (req, res) => {
  const index = findEmployeeIndex(req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: `Employee with id ${req.params.id} not found` });
  }
  const employee = employees[index];
  employee.status = employee.status === 'Active' ? 'On Leave' : 'Active';
  return res.status(200).json(employee);
});

// 5. Delete employee
app.delete('/api/employees/:id', (req, res) => {
  const index = findEmployeeIndex(req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: `Employee with id ${req.params.id} not found` });
  }
  employees.splice(index, 1);
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

app.listen(PORT, HOST, () => {
  console.log(`HR Manager API running at http://${HOST}:${PORT}`);
});
