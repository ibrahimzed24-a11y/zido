// Applies prisma/migrations during the build when a database is configured.
// Uses the unpooled connection when the host provides one (Neon on Vercel sets DATABASE_URL_UNPOOLED).
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.log("migrate: DATABASE_URL is not set, skipping prisma migrate deploy");
  process.exit(0);
}
execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
