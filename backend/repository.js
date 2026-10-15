/**
 * Employee repository layer.
 *
 * Two implementations share the same async interface:
 *   getAll()            -> Employee[]
 *   create({ name, position, salary }) -> Employee
 *   toggleStatus(id)    -> Employee | null   (null = not found)
 *   remove(id)          -> boolean           (false = not found)
 *   getSalaries()       -> number[]
 *
 * Every Employee returned uses the public API shape:
 *   { id: "1", name, position, status: "Active" | "On Leave", salary: 45000 }
 * The prefixed DB column names never leave this file.
 */
const mysql = require('mysql2/promise');

// ---------------------------------------------------------------------------
// Database naming — change the prefix here only.
// ---------------------------------------------------------------------------
const P = 'WanSee_';
const TABLE = 'employees';
const COL = {
  id: `${P}id`,
  name: `${P}name`,
  position: `${P}position`,
  status: `${P}status`,
  salary: `${P}salary`,
};

// Identifiers cannot be bound as ? parameters, so they come only from the
// constants above (never from user input) and are backtick-quoted.
const q = (identifier) => `\`${identifier}\``;
const T = q(TABLE);
const SELECT_COLUMNS = Object.values(COL).map(q).join(', ');

/** DB row (prefixed columns) -> API object (unprefixed keys, id string, salary number). */
const mapRow = (row) => ({
  id: String(row[COL.id]),
  name: row[COL.name],
  position: row[COL.position],
  status: row[COL.status],
  salary: Number(row[COL.salary]),
});

// WanSee_id is INT AUTO_INCREMENT; anything that is not a plain digit string
// cannot match. Rejecting early also stops MySQL from coercing '1abc' to 1.
const isValidDbId = (id) => typeof id === 'string' && /^\d+$/.test(id);

// ---------------------------------------------------------------------------
// MySQL implementation (parameterized queries only)
// ---------------------------------------------------------------------------
function createMySqlRepository(pool) {
  const findById = async (id) => {
    const [rows] = await pool.execute(
      `SELECT ${SELECT_COLUMNS} FROM ${T} WHERE ${q(COL.id)} = ?`,
      [id]
    );
    return rows.length ? mapRow(rows[0]) : null;
  };

  return {
    mode: 'mysql',

    async getAll() {
      const [rows] = await pool.execute(
        `SELECT ${SELECT_COLUMNS} FROM ${T} ORDER BY ${q(COL.id)} ASC`
      );
      return rows.map(mapRow);
    },

    async create({ name, position, salary }) {
      const [result] = await pool.execute(
        `INSERT INTO ${T} (${q(COL.name)}, ${q(COL.position)}, ${q(COL.status)}, ${q(COL.salary)}) VALUES (?, ?, ?, ?)`,
        [name, position, 'Active', salary]
      );
      return findById(String(result.insertId));
    },

    async toggleStatus(id) {
      if (!isValidDbId(id)) return null;
      const [result] = await pool.execute(
        `UPDATE ${T} SET ${q(COL.status)} = IF(${q(COL.status)} = 'Active', 'On Leave', 'Active') WHERE ${q(COL.id)} = ?`,
        [id]
      );
      if (result.affectedRows === 0) return null;
      return findById(id);
    },

    async remove(id) {
      if (!isValidDbId(id)) return false;
      const [result] = await pool.execute(`DELETE FROM ${T} WHERE ${q(COL.id)} = ?`, [id]);
      return result.affectedRows > 0;
    },

    async getSalaries() {
      const [rows] = await pool.execute(`SELECT ${q(COL.salary)} FROM ${T}`);
      return rows.map((r) => Number(r[COL.salary]));
    },
  };
}

// ---------------------------------------------------------------------------
// In-memory implementation (fallback when MySQL is not configured/reachable)
// ---------------------------------------------------------------------------
const SEED_EMPLOYEES = [
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

function createMemoryRepository(seed = SEED_EMPLOYEES) {
  const employees = seed.map((e) => ({ ...e }));
  // Next id counter; ids are unique strings and are never reused after a delete.
  let nextId = employees.length + 1;
  const findIndex = (id) => employees.findIndex((e) => e.id === id);

  return {
    mode: 'in-memory',

    async getAll() {
      return employees.map((e) => ({ ...e }));
    },

    async create({ name, position, salary }) {
      const employee = { id: String(nextId++), name, position, status: 'Active', salary };
      employees.push(employee);
      return { ...employee };
    },

    async toggleStatus(id) {
      const index = findIndex(id);
      if (index === -1) return null;
      const employee = employees[index];
      employee.status = employee.status === 'Active' ? 'On Leave' : 'Active';
      return { ...employee };
    },

    async remove(id) {
      const index = findIndex(id);
      if (index === -1) return false;
      employees.splice(index, 1);
      return true;
    },

    async getSalaries() {
      return employees.map((e) => Number(e.salary));
    },
  };
}

// ---------------------------------------------------------------------------
// Startup: use MySQL if configured and reachable, otherwise fall back.
// ---------------------------------------------------------------------------
async function initRepository(env = process.env) {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.warn('[storage] DB_HOST / DB_USER / DB_NAME not set -> using IN-MEMORY storage');
    return createMemoryRepository();
  }

  const pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT) || 3306,
    user: DB_USER,
    password: DB_PASSWORD || '',
    database: DB_NAME,
    connectionLimit: 10,
    connectTimeout: 5000,
    charset: 'utf8mb4',
  });

  try {
    // Verifies the connection AND that the table has the expected prefixed columns.
    await pool.execute(`SELECT ${SELECT_COLUMNS} FROM ${T} LIMIT 1`);
    console.log(`[storage] Connected to MySQL ${DB_HOST}:${Number(DB_PORT) || 3306}/${DB_NAME} -> using MYSQL storage`);
    return createMySqlRepository(pool);
  } catch (err) {
    console.warn(`[storage] MySQL unavailable (${err.code || err.message}) -> using IN-MEMORY storage`);
    await pool.end().catch(() => {});
    return createMemoryRepository();
  }
}

module.exports = { initRepository };
