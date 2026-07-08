import { Router } from "express";
import protect from "../../middleware/auth.middleware.js";
import {
  createWorkspaceController,
  getMyWorkspacesController,
  getWorkspaceByIdController,
  inviteMemberController,
  acceptInvitationController,
  getPendingInvitationsController,
} from "./workspace.controller.js";

const router = Router();

router.post("/", protect, createWorkspaceController);

router.get("/", protect, getMyWorkspacesController);

router.get("/invitations", protect, getPendingInvitationsController);

router.post("/:workspaceId/invite", protect, inviteMemberController);

router.post("/:workspaceId/accept", protect, acceptInvitationController);

router.get("/:workspaceId", protect, getWorkspaceByIdController);

export default router;
