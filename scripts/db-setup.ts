import { execSync } from "child_process";
import { ensurePostgresRunning } from "./start-embedded-pg";

async function run() {
  console.log("==================================================");
  console.log("🛠️  SPLITEASE DATABASE SETUP");
  console.log("==================================================");

  // 1. Ensure PostgreSQL is active
  await ensurePostgresRunning();

  // 2. Deploy migrations / push schema
  console.log("\n📦 Applying database migrations...");
  try {
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log("✅ Database schema synchronized!");
  } catch (err) {
    console.error("❌ Schema synchronization failed:", err);
    process.exit(1);
  }

  // 3. Generate Prisma client
  console.log("\n🔧 Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit" });

  // 4. Run Seed
  console.log("\n🌱 Seeding database...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });

  console.log("\n✨ Database setup finished successfully!");
}

run().catch((err) => {
  console.error("DB Setup failed:", err);
  process.exit(1);
});
