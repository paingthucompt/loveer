import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET should be at least 16 characters long"),
  PORT: z.string().optional(),
  FRONTEND_ORIGIN: z.string().optional()
});

export const env = envSchema.parse(process.env);
