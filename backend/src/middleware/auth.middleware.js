import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { ApiError } from "../utils/api-error.js";

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "UNAUTHENTICATED", "Missing bearer token");
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const rows = await userRepository.findActiveById(payload.sub);
    const user = rows[0];

    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "User is not active or does not exist");
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      next(new ApiError(401, "UNAUTHENTICATED", "Invalid or expired token"));
      return;
    }

    next(error);
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, "UNAUTHENTICATED", "Authentication is required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, "FORBIDDEN", "You do not have permission to access this resource"));
      return;
    }

    next();
  };
}

