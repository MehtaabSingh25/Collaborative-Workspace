import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspaceById,
  inviteMember,
} from "./workspace.service.js";

export const createWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await createWorkspace(req.body, req.user!.id);

    res.status(201).json(result);
  },
);

export const getMyWorkspacesController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await getMyWorkspaces(req.user!.id);

    res.status(200).json(result);
  },
);

export const getWorkspaceByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = Array.isArray(req.params.workspaceId)
      ? req.params.workspaceId[0]
      : req.params.workspaceId;
    const result = await getWorkspaceById(workspaceId, req.user!.id);

    res.status(200).json(result);
  },
);

export const inviteMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = Array.isArray(req.params.workspaceId)
      ? req.params.workspaceId[0]
      : req.params.workspaceId;
    const result = await inviteMember(workspaceId, req.user!.id, req.body);

    res.status(201).json(result);
  },
);
