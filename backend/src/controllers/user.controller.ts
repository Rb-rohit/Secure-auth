import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import User from "../models/User.js";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80)
});

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await User.findById(
      res.locals.userId
    ).select("email name isEmailVerified status createdAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name } = profileSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(
      res.locals.userId,
      { name },
      { new: true, runValidators: true }
    ).select("email name isEmailVerified status");

    return res.json({
      success: true,
      message: "Profile updated",
      user
    });
  } catch (error) {
    next(error);
  }
}