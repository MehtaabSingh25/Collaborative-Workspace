import { Router } from "express";
import protect from "../../middleware/auth.middleware.js";
import {
  login,
  logout,
  refreshToken,
  register,
  getMe,
} from "./auth.controller.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", protect, getMe);

router.post("/logout", logout);

router.post("/refresh", refreshToken);

export default router;
