// Backend API URL — use your machine's LAN IP so the device/emulator can reach the server.
// Expo dev server is separate (e.g. exp://192.168.1.4:8081); auth runs on the backend.
export const API_BASE_URL =
  (typeof process !== "undefined" && (process as any).env?.EXPO_PUBLIC_API_URL) ||
  "http://192.168.1.4:5000";

// Scrapper (Python Flask) API — e-commerce product search. Run: cd Scrapper/backend && python app.py (uses port 5001).
export const SCRAPPER_API_URL =
  (typeof process !== "undefined" && (process as any).env?.EXPO_PUBLIC_SCRAPPER_URL) ||
  "http://192.168.1.4:5001";