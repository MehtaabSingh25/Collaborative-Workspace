import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import User from "../auth/auth.model.js";
import WorkspaceMember, { MembershipStatus, WorkspaceRole } from "../workspace/workspace-member.model.js";
import { requireWorkspaceMembership, requireWorkspaceRole } from "../workspace/workspace.utils.js";
import Task, { TaskPriority, TaskStatus } from "./task.model.js";
import { createTaskSchema, updateTaskSchema } from "./task.validation.js";

const editableRoles = [WorkspaceRole.OWNER, WorkspaceRole.EDITOR];

async function resolveAssignee(workspaceId: string, email: string | null | undefined) {
  if (email === undefined) return undefined;
  if (email === null || email.trim() === "") return null;
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("_id");
  if (!user) throw new AppError("Assignee account not found", 404);
  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: user._id,
    status: MembershipStatus.ACTIVE,
  });
  if (!membership) throw new AppError("Assignee must be an active workspace member", 400);
  return user._id;
}

export async function listTasks(workspaceId: string, userId: string) {
  await requireWorkspaceMembership(workspaceId, userId);
  const tasks = await Task.find({ workspace: workspaceId })
    .populate("assignee", "name email")
    .populate("createdBy", "name email")
    .sort({ status: 1, dueDate: 1, createdAt: -1 });
  return { success: true, data: tasks };
}

export async function createTask(workspaceId: string, userId: string, body: unknown) {
  await requireWorkspaceRole(workspaceId, userId, editableRoles);
  const data = createTaskSchema.parse(body);
  const assignee = await resolveAssignee(workspaceId, data.assigneeEmail);
  const task = await Task.create({
    workspace: workspaceId,
    title: data.title,
    description: data.description ?? "",
    ...(data.status !== undefined ? { status: data.status as TaskStatus } : {}),
    ...(data.priority !== undefined ? { priority: data.priority as TaskPriority } : {}),
    ...(assignee ? { assignee } : {}),
    ...(data.dueDate ? { dueDate: new Date(`${data.dueDate}T00:00:00.000Z`) } : {}),
    createdBy: userId,
  });
  await task.populate([ { path: "assignee", select: "name email" }, { path: "createdBy", select: "name email" } ]);
  return { success: true, message: "Task created successfully", data: task };
}

export async function updateTask(workspaceId: string, taskId: string, userId: string, body: unknown) {
  if (!mongoose.isValidObjectId(taskId)) throw new AppError("Task not found", 404);
  await requireWorkspaceRole(workspaceId, userId, editableRoles);
  const data = updateTaskSchema.parse(body);
  const task = await Task.findOne({ _id: taskId, workspace: workspaceId });
  if (!task) throw new AppError("Task not found", 404);

  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.status !== undefined) task.status = data.status as TaskStatus;
  if (data.priority !== undefined) task.priority = data.priority as TaskPriority;
  if (data.assigneeEmail !== undefined) {
    const assignee = await resolveAssignee(workspaceId, data.assigneeEmail);
    if (assignee) task.assignee = assignee as mongoose.Types.ObjectId;
    else task.assignee = undefined;
  }
  if (data.dueDate !== undefined) {
    if (data.dueDate) task.dueDate = new Date(`${data.dueDate}T00:00:00.000Z`);
    else task.dueDate = undefined;
  }
  await task.save();
  await task.populate([ { path: "assignee", select: "name email" }, { path: "createdBy", select: "name email" } ]);
  return { success: true, message: "Task updated successfully", data: task };
}

export async function deleteTask(workspaceId: string, taskId: string, userId: string) {
  if (!mongoose.isValidObjectId(taskId)) throw new AppError("Task not found", 404);
  await requireWorkspaceRole(workspaceId, userId, editableRoles);
  const task = await Task.findOneAndDelete({ _id: taskId, workspace: workspaceId });
  if (!task) throw new AppError("Task not found", 404);
  return { success: true, message: "Task deleted successfully" };
}
