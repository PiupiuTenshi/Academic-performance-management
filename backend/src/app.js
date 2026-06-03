import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import academicRoutes from "./routes/academic.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import classRoutes from "./routes/class.routes.js";
import gradeRoutes from "./routes/grade.routes.js";
import healthRoutes from "./routes/health.routes.js";
import retakeRoutes from "./routes/retake.routes.js";
import studentRoutes from "./routes/student.routes.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "academic-performance-management-api",
    docs: {
      health: "/api/v1/health",
      databaseHealth: "/api/v1/health/database",
      authLogin: "/api/v1/auth/login",
    },
  });
});

app.use("/api/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/classes", classRoutes);
app.use("/api/v1/grades", gradeRoutes);
app.use("/api/v1/academic", academicRoutes);
app.use("/api/v1/retakes", retakeRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: error.message || "Internal server error",
      details: error.details || [],
    },
  });
});

export default app;
