

// cookie-parser does not currently provide TypeScript declarations in this project.
// @ts-expect-error The runtime package is installed, but its type package is missing.

import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prism";
import authRoutes from "./auth/auth.routes";
import { authenticate } from "./auth/auth.middleware";
import { requireRole } from "./auth/role.middleware";
import projectRoutes from "./projects/project.routes";
import taskRoutes from "./tasks/task.routes";
import { initSocket } from "./socket";
import notificationRoutes from "./notifications/notification.routes";
import activityRoutes from "./activities/activity.routes";
import userRoutes from "./users/user.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

function startOverdueTaskJob() {
  console.log("Overdue task job initialized");
}

app.use(
  cors({
   

    origin: [
       "http://localhost:5173",
       "http://localhost:5174",
       "http://localhost:5175",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/users", userRoutes);
app.get("/", (_req, res) => {
  res.json({
    message: "Client Dashboard Backend is running!",
  });
});

app.get("/api/test", (_req, res) => {
  app.get("/api/user-test", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("USER TEST ERROR:", error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
  res.json({
    success: true,
    message: "Backend API is working successfully!",
  });
});

app.get("/api/db-test", async (_req, res) => {
  try {
    const userCount = await prisma.user.count();

    res.json({
      success: true,
      message: "Database connection is working!",
      userCount,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed!",
    });
  }
});

app.get("/api/protected", authenticate, (req, res) => {
  res.json({
    success: true,
    message: "You accessed a protected route!",
    user: (req as any).user,
  });
});

app.get(
  "/api/admin-test",
  authenticate,
  requireRole("ADMIN"),
  (_req, res) => {
    res.json({
      success: true,
      message: "Admin access granted!",
    });
  }
);

app.get(
  "/api/manager-test",
  authenticate,
  requireRole("ADMIN", "PROJECT_MANAGER"),
  (_req, res) => {
    res.json({
      success: true,
      message: "Admin or Project Manager access granted!",
    });
  }
);

app.get(
  "/api/developer-test",
  authenticate,
  requireRole("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
  (_req, res) => {
    res.json({
      success: true,
      message: "Authenticated user access granted!",
    });
  }
);
const httpServer = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startOverdueTaskJob();
});

initSocket(httpServer);