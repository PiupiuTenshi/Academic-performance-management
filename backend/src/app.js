import cors from "cors";
import express from "express";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "academic-performance-management-api",
  });
});

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

export default app;

