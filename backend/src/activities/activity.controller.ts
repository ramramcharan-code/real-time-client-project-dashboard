import { Response } from "express";
import prisma from "../lib/prism";
import { AuthRequest } from "../auth/auth.middleware";

export const getRecentActivities = async (
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

    const activities = await prisma.activityLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Activity loading error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
    });
  }
};