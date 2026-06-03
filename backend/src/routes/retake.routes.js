import { Router } from "express";
import { listRetakes } from "../controllers/retake.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

/**
 * @openapi
 * /retakes:
 *   get:
 *     tags:
 *       - Retakes
 *     summary: List retake or repeat-course records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [retake, repeat]
 *     responses:
 *       200:
 *         description: Retake list
 */
router.get("/", authenticate, authorize("academic_staff", "admin"), asyncHandler(listRetakes));

export default router;
