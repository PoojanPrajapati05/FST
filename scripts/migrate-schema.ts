import { ensurePostgresRunning } from "./start-embedded-pg";
import { execSync } from "child_process";

async function run() {
  await ensurePostgresRunning();

  // Push schema changes (adds Transaction + SupportRequest tables)
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env },
  });

  // Regenerate Prisma client
  execSync("npx prisma generate", { stdio: "inherit" });

  console.log("✅ Schema updated and client regenerated!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
