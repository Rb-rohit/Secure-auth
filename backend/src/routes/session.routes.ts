import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";

import {
  getSessions,
  deleteSession,
  deleteAllSessions
} from "../controllers/session.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getSessions);
router.delete("/", deleteAllSessions);
router.delete("/:id", deleteSession);

export default router;