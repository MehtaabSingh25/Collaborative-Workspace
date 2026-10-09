import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(80, "Name must be at most 80 characters"),

  email: z.email().trim().toLowerCase().max(254),

  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be at most 128 characters"),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),

  password: z.string().min(1, "Password is required").max(128, "Password must be at most 128 characters"),
});
