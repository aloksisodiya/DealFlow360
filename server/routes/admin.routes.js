import express from "express";
import {
  login,
  me,
  resetCredentials,
  signup,
} from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/admin-auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.patch("/reset-credentials", requireAdmin, resetCredentials);
router.get("/me", requireAdmin, me);

export default router;
