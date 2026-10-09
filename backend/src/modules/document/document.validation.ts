import { z } from "zod";

export const DOCUMENT_CONTENT_MAX_LENGTH = 500_000;

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),

  content: z
    .string()
    .max(DOCUMENT_CONTENT_MAX_LENGTH, "Document content is too large")
    .optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),

  content: z
    .string()
    .max(DOCUMENT_CONTENT_MAX_LENGTH, "Document content is too large")
    .optional(),

  expectedVersion: z.number().int().nonnegative(),
});


export const restoreDocumentSchema = z.object({
  version: z.number().int().positive(),
  expectedVersion: z.number().int().nonnegative(),
});
