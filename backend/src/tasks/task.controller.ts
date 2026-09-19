import { Response } from "express";
import prisma from "../lib/prism";
import { AuthRequest } from "../auth/auth.middleware";
import { getIO } from "../socket";


// ==========================================
// CREATE TASK
// ==========================================

export const createTask = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      title,
      description,
      projectId,
      developerId,
      priority,
      dueDate,
    } = req.body;

    if (!title || !projectId || !developerId) {
      return res.status(400).json({
        success: false,
        message: "Title, projectId and developerId are required",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check that the project belongs to this manager
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        managerId: req.user.userId,
      },
    });

    if (!project) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    // Check developer exists and has DEVELOPER role
    const developer = await prisma.user.findFirst({
      where: {
        id: developerId,
        role: "DEVELOPER",
      },
    });

    if (!developer) {
      return res.status(400).json({
        success: false,
        message: "Invalid developer",
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        developerId,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: true,
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create notification for developer
    await prisma.notification.create({
      data: {
        userId: developerId,
        message: `You have been assigned a new task: "${title}"`,
      },
    });
    const io = getIO();

io.emit("newNotification", {
  userId: developerId,
  message: `You have been assigned a new task: "${title}"`,
});

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};


// ==========================================
// GET MY TASKS - DEVELOPER
// ==========================================

export const getMyTasks = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const tasks = await prisma.task.findMany({
      where: {
        developerId: req.user.userId,
      },
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
};


// ==========================================
// UPDATE TASK STATUS
// ==========================================

export const updateTaskStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log("🔥 UPDATE TASK STATUS FUNCTION CALLED");
    const taskId = Array.isArray(req.params.taskId)
      ? req.params.taskId[0]
      : req.params.taskId;
    const { status } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const allowedStatuses = [
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DONE",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    // Developer can only update their own assigned task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        developerId: req.user.userId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status,
      },
      include: {
        project: true,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: `Task "${task.title}" changed status to ${status}`,
        taskId: task.id,
        userId: req.user.userId,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: req.user.userId,
        message: `Your task "${task.title}" was updated to ${status}`,
      },
    });

    // Send live Socket.IO update
    try {
     console.log("🔥 EMITTING TASK UPDATE:", updatedTask.id, updatedTask.status);

const io = getIO();

io.emit("taskStatusUpdated", {
        taskId: updatedTask.id,
        title: updatedTask.title,
        status: updatedTask.status,
        developerId: updatedTask.developerId,
        projectId: updatedTask.projectId,
      });
    } catch (socketError) {
      console.error("Socket error:", socketError);
    }

    return res.json({
      success: true,
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task status",
    });
  }
};