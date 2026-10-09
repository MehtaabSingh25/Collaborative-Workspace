import { Router } from "express";
import protect from "../../middleware/auth.middleware.js";
import { authRateLimiter } from "../../middleware/rate-limit.middleware.js";
import {
  login,
  logout,
  refreshToken,
  register,
  getMe,
} from "./auth.controller.js";

const router = Router();

router.post("/register", authRateLimiter, register);

router.post("/login", authRateLimiter, login);

router.get("/me", protect, getMe);

router.post("/logout", logout);

router.post("/refresh", authRateLimiter, refreshToken);

export default router;
