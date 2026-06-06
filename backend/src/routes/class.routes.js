import { Router } from "express";
import { getClassStudents, listClasses, lockGrades } from "../controllers/class.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

/**
 * @openapi
 * /classes:
 *   get:
 *     tags:
 *       - Classes
 *     summary: List class sections for selector screens
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Class section list
 */
router.get("/", authenticate, authorize("lecturer", "academic_staff", "admin"), asyncHandler(listClasses));

/**
 * @openapi
 * /classes/{id}/students:
 *   get:
 *     tags:
 *       - Classes
 *     summary: Get students and grades in a class section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Class students
 */
router.get(
  "/:id/students",
  authenticate,
  authorize("lecturer", "academic_staff", "admin"),
  asyncHandler(getClassStudents),
);
/**
 * @openapi
 * /classes/{id}/lock-grades:
 *   post:
 *     tags:
 *       - Classes
 *     summary: Lock grades for a class section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Grade sheet locked
 */
router.post("/:id/lock-grades", authenticate, authorize("lecturer"), asyncHandler(lockGrades));

export default router;
