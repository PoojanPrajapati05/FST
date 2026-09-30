import epPkg from "embedded-postgres";
import net from "net";

const EmbeddedPostgres = (epPkg as any).default || epPkg;

async function isPortOpen(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function ensurePostgresRunning() {
  const isRunning = await isPortOpen(5432);
  if (isRunning) {
    console.log("✅ PostgreSQL is already running on port 5432.");
    return null;
  }

  console.log("🚀 Initializing embedded PostgreSQL on port 5432...");
  const pg = new EmbeddedPostgres({
    databaseDir: "./.pgdata",
    port: 5432,
    user: "postgres",
    password: "password",
    persistent: true,
  });

  // Only call initialise() if pgdata directory is empty / doesn't exist
  const fs = await import("fs");
  const pgdataExists = fs.existsSync("./.pgdata") && fs.readdirSync("./.pgdata").length > 0;
  
  if (!pgdataExists) {
    await pg.initialise();
  }
  await pg.start();

  try {
    await pg.createDatabase("splitease");
    console.log("Created database splitease.");
  } catch (err: any) {
    // Database might already exist
    if (!err.message?.includes("already exists")) {
      console.warn("Database note:", err.message);
    }
  }

  console.log("✅ Embedded PostgreSQL is ready on port 5432!");
  return pg;
}

if (require.main === module) {
  ensurePostgresRunning()
    .then(() => {
      console.log("Postgres setup complete.");
    })
    .catch((err) => {
      console.error("Failed to run embedded postgres:", err);
      process.exit(1);
    });
}
