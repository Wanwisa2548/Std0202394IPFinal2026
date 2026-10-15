/**
 * API base URL — change this ONE value depending on where the app runs.
 *
 *   Android emulator          -> http://10.0.2.2:3000
 *       (10.0.2.2 is the emulator's alias for your computer's localhost)
 *   iOS simulator / web       -> http://localhost:3000
 *   Physical phone (Expo Go)  -> http://<computer LAN IP>:3000   e.g. http://192.168.1.25:3000
 *       (phone and computer must be on the same Wi-Fi; find the IP with
 *        `ipconfig` on Windows or `ifconfig` / `ipconfig getifaddr en0` on macOS,
 *        and allow port 3000 through the firewall)
 */
export const API_BASE_URL = 'http://localhost:3000';

// Requests that take longer than this are treated as a network error.
export const REQUEST_TIMEOUT_MS = 10000;
