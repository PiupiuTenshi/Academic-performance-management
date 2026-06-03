import { Router } from "express";
import { createUser, getAuditLogs, updateUserStatus } from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get audit logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit logs
 */
router.get("/audit-logs", authenticate, authorize("admin"), asyncHandler(getAuditLogs));

/**
 * @openapi
 * /admin/users:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: student02
 *               password:
 *                 type: string
 *                 example: "123456"
 *               role:
 *                 type: string
 *                 enum: [student, lecturer, academic_staff, admin]
 *                 example: student
 *               profile:
 *                 type: object
 *                 properties:
 *                   studentCode:
 *                     type: string
 *                     example: SV002
 *                   fullName:
 *                     type: string
 *                     example: Le Van C
 *                   email:
 *                     type: string
 *                     example: student02@example.com
 *     responses:
 *       201:
 *         description: User created
 */
router.post("/users", authenticate, authorize("admin"), asyncHandler(createUser));

/**
 * @openapi
 * /admin/users/{id}/status:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Lock or unlock a user
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
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/users/:id/status", authenticate, authorize("admin"), asyncHandler(updateUserStatus));

export default router;
