import { Router } from "express";
import { getClientConfig } from "../controllers/client.controller.js";

const router = Router();

/**
 * @openapi
 * /client/config:
 *   get:
 *     tags:
 *       - Client
 *     summary: Get frontend integration config
 *     responses:
 *       200:
 *         description: Client config
 */
router.get("/config", getClientConfig);

export default router;
