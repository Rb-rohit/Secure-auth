import { Request, Response, NextFunction } from "express";

import { getSession } from "../services/session.service.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.sid;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const result = await getSession(token);

    if (!result) {
      res.clearCookie("sid");

      return res.status(401).json({
        success: false,
        message: "Session expired or invalid"
      });
    }

    res.locals.userId = result.data.userId;
    res.locals.sessionHash = result.tokenHash;
    res.locals.session = result.data;

    next();
  } catch (error) {
    next(error);
  }
}