import { Request, Response, NextFunction } from "express";

import {
  listSessions,
  revokeSession,
  revokeAllSessions
} from "../services/session.service.js";

export async function getSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sessions = await listSessions(
      res.locals.userId
    );

    return res.json({
      success: true,
      sessions
    });
  } catch (error) {
    next(error);
  }
}


export async function deleteSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionId = req.params.id;

    if (typeof sessionId !== "string" || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID"
      });
    }

    const success = await revokeSession(
      res.locals.userId,
      sessionId
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    if (sessionId === res.locals.sessionHash) {
      res.clearCookie("sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
      });
    }

    return res.json({
      success: true,
      message: "Session revoked successfully"
    });
  } catch (error) {
    next(error);
  }
}


export async function deleteAllSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await revokeAllSessions(res.locals.userId);

    res.clearCookie("sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    return res.json({
      success: true,
      message: "All sessions revoked successfully"
    });
  } catch (error) {
    next(error);
  }
}