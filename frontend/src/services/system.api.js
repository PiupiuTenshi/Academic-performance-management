import api from "./api";

// GET /health
export function getHealth() {
  return api.get("/health").then((r) => r.data.data || r.data);
}

// GET /health/database
export function getDatabaseHealth() {
  return api.get("/health/database").then((r) => r.data.data || r.data);
}

// GET /client/config
export function getClientConfig() {
  return api.get("/client/config").then((r) => r.data.data);
}
