import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';

/**
 * Small fetch wrapper:
 * - adds a timeout so an unreachable server becomes a clear error
 * - parses JSON safely
 * - throws an Error (with the server's message when available) on non-2xx
 */
async function request(path, { method = 'GET', body, token } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const reason = err && err.name === 'AbortError' ? 'Request timed out' : 'Network request failed';
    throw new Error(`${reason}. Cannot reach the server at ${API_BASE_URL}. Check that the backend is running and the URL in src/config.js is correct.`);
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = (data && data.message) || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const login = (username, password) =>
  request('/api/login', { method: 'POST', body: { username, password } });

export const getEmployees = (token) => request('/api/employees', { token });

export const addEmployee = (token, employee) =>
  request('/api/employees', { method: 'POST', body: employee, token });

export const toggleEmployeeStatus = (token, id) =>
  request(`/api/employees/${encodeURIComponent(id)}/status`, { method: 'PUT', token });

export const deleteEmployee = (token, id) =>
  request(`/api/employees/${encodeURIComponent(id)}`, { method: 'DELETE', token });

export const getSalaryClusters = (token) => request('/api/employees/salary-clusters', { token });

export const getHealth = () => request('/api/health');
