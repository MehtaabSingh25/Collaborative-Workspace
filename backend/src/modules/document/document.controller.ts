import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { createDocument } from "./document.service.js";

export const createDocumentController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = Array.isArray(req.params.workspaceId)
      ? req.params.workspaceId[0]
      : req.params.workspaceId;

    const result = await createDocument(
      workspaceId,
      req.user!.id,
      req.body,
    );

    res.status(201).json(result);
  },
);
