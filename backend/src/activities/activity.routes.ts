import { Router } from "express";
import { getRecentActivities } from "./activity.controller";
import { authenticate } from "../auth/auth.middleware";
import { requireRole } from "../auth/role.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN", "PROJECT_MANAGER"),
  getRecentActivities
);

export default router;