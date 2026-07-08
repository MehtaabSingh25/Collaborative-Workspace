import { Router } from "express";
import protect from "../../middleware/auth.middleware.js";
import {
  createWorkspaceController,
  getMyWorkspacesController,
  getWorkspaceByIdController,
  inviteMemberController,
} from "./workspace.controller.js";

const router = Router();

router.post("/", protect, createWorkspaceController);

router.get("/", protect, getMyWorkspacesController);

router.get("/:workspaceId", protect, getWorkspaceByIdController);

router.post("/:workspaceId/invite", protect, inviteMemberController);

export default router;
