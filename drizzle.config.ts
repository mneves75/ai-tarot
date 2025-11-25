import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local for local development (Next.js convention)
config({ path: ".env.local" });
config(); // Also load .env as fallback

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: (() => {
      const url = process.env["DATABASE_URL"];
      if (!url || url.trim() === "") {
        throw new Error("DATABASE_URL is required for Drizzle config");
      }
      return url;
    })(),
  },
  verbose: true,
  strict: true,
} satisfies Config;
