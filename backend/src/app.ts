import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SecureAuth API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/users", userRoutes);

// Centralized error handler.
app.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof Error && error.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Invalid request data"
    });
  }

  const message = error instanceof Error
    ? error.message
    : "Internal server error";

  const status = message.includes("limit exceeded") ||
    message.includes("wait before")
      ? 429
      : 400;

  console.error("Request error:", message);

  return res.status(status).json({
    success: false,
    message
  });
});

export default app;