import { Response } from "express";
import prisma from "../lib/prism";
import { AuthRequest } from "../auth/auth.middleware";

export const getMyNotifications = async (
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

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    const unreadCount = notifications.filter(
      (notification) => !notification.isRead
    ).length;

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

export const markNotificationsRead = async (
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

    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return res.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Mark notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
};