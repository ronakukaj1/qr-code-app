import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dbPath = path.join(root, "prisma/dev.sqlite");

const result = spawnSync("sqlite3", [dbPath, "DELETE FROM Session;"], {
  stdio: "inherit",
});

if (result.status !== 0) {
  console.error("Failed to reset sessions.");
  process.exit(result.status ?? 1);
}

console.log("Cleared Shopify sessions. Restart dev and open the app again to re-authenticate.");
