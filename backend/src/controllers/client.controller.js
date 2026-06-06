import { env } from "../config/env.js";
import { sendSuccess } from "../utils/http-response.js";

export function getClientConfig(_req, res) {
  sendSuccess(res, {
    apiBaseUrl: "/api/v1",
    swaggerUrl: "/api-docs",
    corsOrigins: env.corsOrigins,
    roles: ["student", "lecturer", "academic_staff", "admin"],
    tokenStorageKey: "apm_access_token",
  });
}

