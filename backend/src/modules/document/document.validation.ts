import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),

  content: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),

  content: z.string().optional(),
});
