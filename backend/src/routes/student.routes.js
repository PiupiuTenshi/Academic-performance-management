import { Router } from "express";
import { getTranscript } from "../controllers/student.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

/**
 * @openapi
 * /students/{id}/transcript:
 *   get:
 *     tags:
 *       - Students
 *     summary: Get student transcript
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transcript data
 *       403:
 *         description: Forbidden
 */
router.get(
  "/:id/transcript",
  authenticate,
  authorize("student", "academic_staff", "admin"),
  asyncHandler(getTranscript),
);

export default router;
