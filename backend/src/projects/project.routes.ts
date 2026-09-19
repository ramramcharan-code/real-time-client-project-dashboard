import { Router } from "express";

import {
  createProject,
  getMyProjects,
  getDevelopers,
  getDeveloperProjects,
} from "./project.controller";

import { authenticate } from "../auth/auth.middleware";
import { requireRole } from "../auth/role.middleware";

const router = Router();

// GET MY PROJECTS
router.get(
  "/",
  authenticate,
  requireRole("PROJECT_MANAGER"),
  getMyProjects
);

// CREATE PROJECT
router.post(
  "/",
  authenticate,
  requireRole("PROJECT_MANAGER"),
  createProject
);

// GET DEVELOPERS
router.get(
  "/developers",
  authenticate,
  requireRole("PROJECT_MANAGER"),
  getDevelopers
);
// GET PROJECTS ASSIGNED TO CURRENT DEVELOPER
router.get(
  "/my",
  authenticate,
  requireRole("DEVELOPER"),
  getDeveloperProjects
);
export default router;