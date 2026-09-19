import { Request, Response } from "express";
import prisma from "../lib/prism";

export const getDevelopers = async (
  req: Request,
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
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      developers,
    });
  } catch (error) {
    console.error("Developer loading error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load developers",
    });
  }
};