import { Router } from "express";
import { calculateFinalScores, classifySemester, listSemesters } from "../controllers/academic.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

/**
 * @openapi
 * /academic/semesters:
 *   get:
 *     tags:
 *       - Academic
 *     summary: List semesters for frontend filters
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Semester list
 */
router.get(
  "/semesters",
  authenticate,
  authorize("student", "lecturer", "academic_staff", "admin"),
  asyncHandler(listSemesters),
);

/**
 * @openapi
 * /academic/calculate-final:
 *   post:
 *     tags:
 *       - Academic
 *     summary: Calculate final scores for a class section
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               classSectionId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Calculation result
 */
router.post("/calculate-final", authenticate, authorize("academic_staff"), asyncHandler(calculateFinalScores));

/**
 * @openapi
 * /academic/classify:
 *   post:
 *     tags:
 *       - Academic
 *     summary: Classify academic records for a semester
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               semesterId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Classification result
 */
router.post("/classify", authenticate, authorize("academic_staff"), asyncHandler(classifySemester));

export default router;
