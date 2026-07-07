import dotenv from "dotenv";
import { z } from "zod";
import type { StringValue } from "ms";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),

  MONGODB_URI: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(1),

  JWT_REFRESH_SECRET: z.string().min(1),

  ACCESS_TOKEN_EXPIRES_IN: z.custom<StringValue>(),

  REFRESH_TOKEN_EXPIRES_IN: z.custom<StringValue>(),
});

const env = envSchema.parse(process.env);

export default env;