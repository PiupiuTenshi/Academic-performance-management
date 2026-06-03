import { Router } from "express";
import { getDatabaseHealth, getHealth } from "../controllers/health.controller.js";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check API health
 *     responses:
 *       200:
 *         description: API is running
 */
router.get("/", getHealth);

/**
 * @openapi
 * /health/database:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check database connection
 *     responses:
 *       200:
 *         description: Database connection is working
 */
router.get("/database", getDatabaseHealth);

export default router;
