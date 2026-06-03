import { Router } from "express";
import { saveBulkGrades, updateGrade } from "../controllers/grade.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

/**
 * @openapi
 * /grades/bulk:
 *   post:
 *     tags:
 *       - Grades
 *     summary: Save grades in bulk
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
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     enrollmentId:
 *                       type: integer
 *                       example: 1
 *                     attendanceScore:
 *                       type: number
 *                       example: 8
 *                     assignmentScore:
 *                       type: number
 *                       example: 7
 *                     midtermScore:
 *                       type: number
 *                       example: 6.5
 *                     finalScore:
 *                       type: number
 *                       example: 9
 *     responses:
 *       200:
 *         description: Save result
 */
router.post("/bulk", authenticate, authorize("lecturer"), asyncHandler(saveBulkGrades));

/**
 * @openapi
 * /grades/{id}:
 *   put:
 *     tags:
 *       - Grades
 *     summary: Update one grade record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attendanceScore:
 *                 type: number
 *                 example: 8
 *               assignmentScore:
 *                 type: number
 *                 example: 7
 *               midtermScore:
 *                 type: number
 *                 example: 6.5
 *               finalScore:
 *                 type: number
 *                 example: 9
 *     responses:
 *       200:
 *         description: Grade updated
 */
router.put("/:id", authenticate, authorize("lecturer", "academic_staff"), asyncHandler(updateGrade));

export default router;
