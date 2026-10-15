# HR Manager & Salary Analytics System

Full-stack exam project:

- **backend/**: Express.js REST API. Data lives in an in-memory array, and salary tiers come from a hand-written 1D K-Means (k = 3).
- **frontend/**: React Native (Expo, JavaScript) app with a Login screen and a Dashboard screen.

## Requirements

- Node.js 18+ (tested with Node 24) and npm
- Expo Go on a phone, or an Android emulator / iOS simulator / web browser

## 1. Start the backend (port 3000)

```bash
cd backend
npm install
npm start
```

The API listens on `http://0.0.0.0:3000`, so an emulator or phone on the same network can reach it.

## 2. Start the frontend

First set the API URL in `frontend/src/config.js`:

| Where the app runs | `API_BASE_URL` |
|---|---|
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
| POST | `/api/login` | `{ username, password }` → `200 { success, token }` or `401` |
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | `{ name, position, salary }` → `201` employee, or `400` if invalid |
| PUT | `/api/employees/:id/status` | Toggle `Active` ↔ `On Leave` (`404` if not found) |
| DELETE | `/api/employees/:id` | Delete an employee (`404` if not found) |
| GET | `/api/employees/salary-clusters` | K-Means salary tiers: `{ success, clusters: [{ group, centroid, count }] }` |

### Quick curl test

```bash
curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"password123"}'
curl http://localhost:3000/api/employees
curl http://localhost:3000/api/employees/salary-clusters
```

## K-Means notes

- Only salaries are clustered. Centroids start at the min, median and max of the sorted unique salaries, so they are deterministic and distinct.
- The loop assigns each salary to its nearest centroid and recomputes the means. It stops when assignments stop changing, or after 100 iterations.
- With 0 employees the response is `clusters: []`. With fewer than 3 unique salaries, k equals the number of unique salaries. An empty cluster keeps its previous centroid.
- Clusters are sorted by centroid and labelled `Tier 1`, `Tier 2`, `Tier 3`. Centroids are rounded to integers.
