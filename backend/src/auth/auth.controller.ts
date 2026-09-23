import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../lib/prism";

const JWT_SECRET = process.env.JWT_SECRET || "practice-secret-key";

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

// ================= REGISTER =================

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Only allow these roles to register
    if (role !== "DEVELOPER" && role !== "PROJECT_MANAGER") {
      return res.status(400).json({
        success: false,
        message:
          "Only Developer or Project Manager registration is allowed",
      });
    }

    // Normalize email
    const normalizedEmail = String(email).trim().toLowerCase();

    // Check existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
      },
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

// ================= LOGIN =================

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Normalize email
    const normalizedEmail = String(email).trim().toLowerCase();

    // Find user
    // findFirst avoids the Prisma @unique requirement on email
   const user = await prisma.user.findUnique({
  where: {
    email: normalizedEmail,
  },
});

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create short-lived access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    // Generate refresh token
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
      },
    });

    // Send refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

// ================= REFRESH TOKEN =================

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check expiry
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: {
          id: storedToken.id,
        },
      });

      return res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    // Create new access token
    const newAccessToken = jwt.sign(
      {
        userId: storedToken.user.id,
        role: storedToken.user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    return res.json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("REFRESH TOKEN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};