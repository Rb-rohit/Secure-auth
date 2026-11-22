import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import User from "../models/User.js";

import {
  requestOTP,
  verifyOTP
} from "../services/otp.service.js";

import { createSession } from "../services/session.service.js";

const emailSchema = z.string().email().max(254);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/"
};


export const requestOTPController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = z.string().email().parse(req.body.email);

    const result = await requestOTP(
      email,
      req.ip || "unknown"
    );

    return res.status(200).json({
      success: true,
      message: "OTP request accepted. Email is being processed.",
      queued: result.queued
    });

  } catch (error) {
    next(error);
  }
};


export async function verifyOTPController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const email = emailSchema.parse(
      req.body.email
    ).toLowerCase();

    const otp = z.string()
      .regex(/^\d{6}$/)
      .parse(req.body.otp);

    await verifyOTP(email, otp);

    const user = await User.findOneAndUpdate(
  { email },
  {
    $setOnInsert: {
      email,
      status: "active"
    },
    $set: {
      isEmailVerified: true
    }
  },
  {
    new: true,
    upsert: true,
    runValidators: true
  }
);

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked"
      });
    }

    const { token } = await createSession(
      user.id,
      req.get("user-agent") || "Unknown",
      req.ip || "unknown"
    );

    res.cookie("sid", token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function meController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await User.findById(
      res.locals.userId
    ).select("-__v");

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "User not available"
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { revokeSession } = await import(
      "../services/session.service.js"
    );

    await revokeSession(
      res.locals.userId,
      res.locals.sessionHash
    );

    res.clearCookie("sid", cookieOptions);

    return res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
}