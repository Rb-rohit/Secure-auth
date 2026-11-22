import { Router } from "express";

import {
  requestOTPController,
  verifyOTPController,
  meController,
  logoutController
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/request-otp", requestOTPController);
router.post("/verify-otp", verifyOTPController);

router.get("/me", authenticate, meController);
router.post("/logout", authenticate, logoutController);

export default router;
