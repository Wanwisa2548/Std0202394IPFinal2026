# HR Manager & Salary Analytics System

Full-stack exam project:

- **backend/**: Express.js REST API. Data is stored in MySQL, or in an in-memory array if MySQL is not configured or not reachable. Salary tiers come from a hand-written 1D K-Means (k = 3).
- **frontend/**: React Native (Expo, JavaScript) app with a Login screen and a Dashboard screen.

## Quick start for the examiner

The backend is deployed on the course server at **http://119.59.102.161:3038**, using the MySQL database `ip_std6730202394`. The frontend uses this URL by default, so only the frontend needs to be started:

```bash
cd frontend
npm install
npx expo start
```

Log in with `admin` / `password123`. To check the backend: http://119.59.102.161:3038/api/health should return `{"success":true,"storage":"mysql"}`.

To run the backend locally instead, see section 2 and change `API_BASE_URL` in `frontend/src/config.js`.

## Requirements

- Node.js 18+ (tested with Node 24) and npm
- Expo Go on a phone, or an Android emulator / iOS simulator / web browser

## 1. Database (MySQL)

Every column name has the prefix `WanSee_`. The prefix is defined once as `P` in `backend/repository.js`. The API still returns unprefixed keys (`id`, `name`, `position`, `status`, `salary`).

**Option A, import the dump:** in phpMyAdmin, select your database, open **Import**, and choose [`backend/database/employees.sql`](backend/database/employees.sql). It is an export of the live table, with its structure and 8 employees. Import it into a database that has no `employees` table yet.

**Option B, run SQL by hand:** run this in phpMyAdmin (SQL tab) on your database:

```sql
DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
  WanSee_id       INT AUTO_INCREMENT PRIMARY KEY,
  WanSee_name     VARCHAR(100) NOT NULL,
  WanSee_position VARCHAR(100) NOT NULL,
  WanSee_status   ENUM('Active','On Leave') NOT NULL DEFAULT 'Active',
  WanSee_salary   DECIMAL(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO employees (WanSee_name, WanSee_position, WanSee_status, WanSee_salary) VALUES
  ('John Doe',      'Software Engineer', 'Active',   45000),
  ('Jane Smith',    'HR Officer',        'Active',   18000),
  ('Somchai Dee',   'Admin Staff',       'On Leave', 17500),
  ('Suda Jaidee',   'Accountant',        'Active',   20000),
  ('Michael Brown', 'Senior Developer',  'Active',   52000),
  ('Emily Davis',   'UX Designer',       'Active',   42000),
  ('Anan Srisuk',   'IT Manager',        'Active',   85000),
  ('Sarah Wilson',  'CTO',               'Active',   90000);
```

Then create `backend/.env` from the template (it is git-ignored) and fill in your credentials:

```bash
cd backend
cp .env.example .env
```

| Variable | Example |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | your MySQL user |
| `DB_PASSWORD` | your MySQL password |
| `DB_NAME` | `ip_std6730202394` |

**Fallback:** if `.env` is missing, MySQL cannot be reached, or the table does not have the `WanSee_` columns, the server logs a warning and uses in-memory storage with seed data. The startup log and `GET /api/health` show which mode is active.

## 2. Start the backend (port 3000)

```bash
cd backend
npm install
npm start
```

The API listens on `http://0.0.0.0:3000`, so an emulator or phone on the same network can reach it. Set `PORT` in `.env` to use a different port. Run locally without a reachable MySQL, it uses in-memory storage.

## Deploy the backend to the university server (FileZilla + PuTTY)

MySQL on 119.59.102.161 is only reachable from the server itself, so the backend has to run there to use the database.

**1. Prepare `.env` locally.** Create `backend/.env` from `.env.example` with `PORT=3038` and `DB_HOST=localhost`. The `DB_*` values are the same as in your previous project's `.env`.

**2. Upload with FileZilla** (SFTP, `119.59.102.161`, user `std6730202394`):
- On the remote side, go to `/app` and create a **new** folder, `hr-backend`. Do **not** upload into `/app/backend`, which holds another project.
- Upload `server.js`, `repository.js`, `package.json`, `package-lock.json` and `.env` into `/app/hr-backend`.
- Don't upload `node_modules`. Install it on the server in the next step.

**3. Run with PuTTY** (SSH to the same host):

```bash
cd /app/hr-backend
node -v                      # Express 5 needs Node 18 or newer
npm install --omit=dev

pm2 list                     # if another app already uses port 3038, stop it first:
pm2 stop <name-or-id>

pm2 start server.js --name hr-backend
pm2 logs hr-backend --lines 20   # should say "using MYSQL storage" and "(storage: mysql)"
curl http://localhost:3038/api/health   # {"success":true,"storage":"mysql"}
pm2 save
```

Restart after uploading new files: `pm2 restart hr-backend`. Without pm2 you can use `npm start`, but it stops when PuTTY closes.

**4. Frontend:** `API_BASE_URL` in `frontend/src/config.js` is already `http://119.59.102.161:3038`.

## 3. Start the frontend

First set the API URL in `frontend/src/config.js`:

| Where the app runs | `API_BASE_URL` |
|---|---|
| Backend on the university server (default) | `http://119.59.102.161:3038` |
| Android emulator | `http://10.0.2.2:3000` |
| iOS simulator / web | `http://localhost:3000` |
| Physical phone (Expo Go) | `http://<computer LAN IP>:3000` |

Then, in a second terminal:

```bash
cd frontend
npm install
npx expo start
```

Then press `a` (Android), `i` (iOS) or `w` (web), or scan the QR code with Expo Go.

**Login:** username `admin`, password `password123`

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | `{ success, storage: "mysql" \| "in-memory" }` |
| POST | `/api/login` | `{ username, password }` → `200 { success, token }` or `401` |
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | `{ name, position, salary }` → `201` employee, or `400` if invalid (empty fields, salary not a positive number or above 9,999,999,999.99, name/position over 100 chars) |
| PUT | `/api/employees/:id/status` | Toggle `Active` ↔ `On Leave` (`404` if not found) |
| DELETE | `/api/employees/:id` | Delete an employee (`404` if not found) |
| GET | `/api/employees/salary-clusters` | K-Means salary tiers: `{ success, clusters: [{ group, centroid, count }] }` |

**Authentication:** every `/api/employees...` endpoint requires the token from `/api/login` in the header `Authorization: Bearer mock-jwt-token`. Requests without it, or with a wrong token, get `401 { success: false, message }`. `/api/login` and `/api/health` are public. The app sends the token automatically after login.

### Quick curl test

```bash
curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"password123"}'
curl http://localhost:3000/api/employees                                                  # 401 (no token)
curl http://localhost:3000/api/employees -H "Authorization: Bearer mock-jwt-token"        # 200
curl http://localhost:3000/api/employees/salary-clusters -H "Authorization: Bearer mock-jwt-token"
```

## K-Means notes

- Only salaries are clustered. Centroids start at the min, median and max of the sorted unique salaries, so they are deterministic and distinct.
- The loop assigns each salary to its nearest centroid and recomputes the means. It stops when assignments stop changing, or after 100 iterations.
- With 0 employees the response is `clusters: []`. With fewer than 3 unique salaries, k equals the number of unique salaries. An empty cluster keeps its previous centroid.
- Clusters are sorted by centroid and labelled `Tier 1`, `Tier 2`, `Tier 3`. Centroids are rounded to integers.
