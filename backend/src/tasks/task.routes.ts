import { Router } from "express";
import {
  createTask,
  getMyTasks,
  updateTaskStatus,
} from "./task.controller";

import { authenticate } from "../auth/auth.middleware";
import { requireRole } from "../auth/role.middleware";

const router = Router();

router.get(
  "/my",
  authenticate,
  requireRole("DEVELOPER"),
  getMyTasks
);

router.patch(
  "/:taskId/status",
  authenticate,
  requireRole("DEVELOPER"),
  updateTaskStatus
);

router.post(
  "/",
  authenticate,
  requireRole("ADMIN", "PROJECT_MANAGER"),
  createTask
);

export default router;