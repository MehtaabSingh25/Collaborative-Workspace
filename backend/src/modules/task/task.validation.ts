import { z } from "zod";

const title = z.string().trim().min(1, "Task title is required").max(160);
const description = z.string().trim().max(2000).optional();
const status = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
const priority = z.enum(["LOW", "MEDIUM", "HIGH"]);
const assigneeEmail = z.union([z.email(), z.literal(""), z.null()]).optional();
const dueDate = z.union([z.iso.date(), z.literal(""), z.null()]).optional();

export const createTaskSchema = z.object({
  title,
  description,
  status: status.optional(),
  priority: priority.optional(),
  assigneeEmail,
  dueDate,
});

export const updateTaskSchema = z.object({
  title: title.optional(),
  description,
  status: status.optional(),
  priority: priority.optional(),
  assigneeEmail,
  dueDate,
});
