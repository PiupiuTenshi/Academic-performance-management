import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { ApiError } from "../utils/api-error.js";
import { sendSuccess } from "../utils/http-response.js";

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "VALIDATION_ERROR", "Username and password are required");
  }

  const rows = await userRepository.findByUsername(username);
  const user = rows[0];

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid username or password");
  }

  if (!user.is_active) {
    throw new ApiError(403, "ACCOUNT_LOCKED", "Account is locked");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid username or password");
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      username: user.username,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  sendSuccess(res, {
    accessToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
}

export function logout(_req, res) {
  sendSuccess(res, null, "Logged out");
}

export function getMe(req, res) {
  sendSuccess(res, {
    user: req.user,
    menu: buildMenuForRole(req.user.role),
  });
}

function buildMenuForRole(role) {
  const common = [{ key: "dashboard", label: "Dashboard", path: "/dashboard" }];

  const menus = {
    student: [
      ...common,
      { key: "transcript", label: "Transcript", path: "/transcript" },
    ],
    lecturer: [
      ...common,
      { key: "grade-input", label: "Grade Input", path: "/grades/input" },
    ],
    academic_staff: [
      ...common,
      { key: "academic-processing", label: "Academic Processing", path: "/academic" },
      { key: "retakes", label: "Retakes", path: "/retakes" },
    ],
    admin: [
      ...common,
      { key: "users", label: "Users", path: "/admin/users" },
      { key: "audit-logs", label: "Audit Logs", path: "/admin/audit-logs" },
    ],
  };

  return menus[role] || common;
}
