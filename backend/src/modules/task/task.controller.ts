import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { createTask, deleteTask, listTasks, updateTask } from "./task.service.js";

const param = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value ?? "";

export const listTasksController = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await listTasks(param(req.params.workspaceId), req.user!.id));
});
export const createTaskController = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await createTask(param(req.params.workspaceId), req.user!.id, req.body));
});
export const updateTaskController = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await updateTask(param(req.params.workspaceId), param(req.params.taskId), req.user!.id, req.body));
});
export const deleteTaskController = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await deleteTask(param(req.params.workspaceId), param(req.params.taskId), req.user!.id));
});
