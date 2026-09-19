import { Response } from "express";
import prisma from "../lib/prism";
import { AuthRequest } from "../auth/auth.middleware";

// CREATE PROJECT
export const createProject = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        managerId: req.user.userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};


// GET MY PROJECTS WITH TASKS
export const getMyProjects = async (
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

    const projects = await prisma.project.findMany({
      where: {
        managerId: req.user.userId,
      },

      include: {
        tasks: {
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};


// GET ALL DEVELOPERS
export const getDevelopers = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const developers = await prisma.user.findMany({
      where: {
        role: "DEVELOPER",
      },

      select: {
        id: true,
        name: true,
        email: true,
      },

      orderBy: {
        name: "asc",
      },
    });

    return res.json({
      success: true,
      developers,
    });
  } catch (error) {
    console.error("Get developers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch developers",
    });
  }
};
// GET PROJECTS ASSIGNED TO CURRENT DEVELOPER
export const getDeveloperProjects = async (
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

    const projects = await prisma.project.findMany({
      where: {
        tasks: {
          some: {
            developerId: req.user.userId,
          },
        },
      },

      include: {
        tasks: {
          where: {
            developerId: req.user.userId,
          },
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get developer projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch developer projects",
    });
  }
};
