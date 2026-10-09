import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { listChatMessages } from "./chat.service.js";

const param = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value ?? "";

export const listChatMessagesController = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await listChatMessages(param(req.params.workspaceId), req.user!.id));
});
