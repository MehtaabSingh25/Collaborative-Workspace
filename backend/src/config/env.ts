import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["MONGODB_URI", "PORT"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const env = {
  PORT: process.env.PORT!,
  MONGODB_URI: process.env.MONGODB_URI!,
};

export default env;