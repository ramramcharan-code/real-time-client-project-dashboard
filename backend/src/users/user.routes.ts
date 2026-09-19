import { Router } from "express";
import { getDevelopers } from "./user.controller";
import { authenticate } from "../auth/auth.middleware";
import { requireRole } from "../auth/role.middleware";

const router = Router();

router.get(
  "/developers",
  authenticate,
  requireRole("ADMIN", "PROJECT_MANAGER"),
  getDevelopers
);

export default router;