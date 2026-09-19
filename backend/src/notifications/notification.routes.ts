import { Router } from "express";
import {
  getMyNotifications,
  markNotificationsRead,
} from "./notification.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

router.get("/", authenticate, getMyNotifications);

router.patch("/read", authenticate, markNotificationsRead);

export default router;