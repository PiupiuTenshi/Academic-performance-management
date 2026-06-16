import api from "./api";

// POST /auth/login
export function login(username, password) {
  return api.post("/auth/login", { username, password }).then((r) => r.data.data);
}

// POST /auth/logout
export function logout() {
  return api.post("/auth/logout").then((r) => r.data);
}

// GET /auth/me
export function getMe() {
  return api.get("/auth/me").then((r) => r.data.data);
}
