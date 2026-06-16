import api from "./api";

// GET /admin/users
export function getUsers(params = {}) {
  return api.get("/admin/users", { params }).then((r) => r.data.data);
}

// POST /admin/users
export function createUser(payload) {
  return api.post("/admin/users", payload).then((r) => r.data.data);
}

// PATCH /admin/users/:id/status
export function updateUserStatus(userId, isActive) {
  return api.patch(`/admin/users/${userId}/status`, { isActive }).then((r) => r.data.data);
}

// GET /admin/audit-logs
export function getAuditLogs(params = {}) {
  return api.get("/admin/audit-logs", { params }).then((r) => r.data.data);
}
