import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, ".shopify/dev-bundle/manifest.json");
const syncScript = path.join(__dirname, "sync-post-purchase-app-url.mjs");

let lastSyncedUrl = null;
let syncInFlight = false;

function readAppUrl() {
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const appHome = manifest.modules.find((module) => module.type === "app_home");
    return appHome?.config?.app_url?.replace(/\/$/, "") ?? null;
  } catch {
    return null;
  }
}

function syncAppUrl() {
  const appUrl = readAppUrl();

  if (!appUrl || appUrl === lastSyncedUrl || syncInFlight) {
    return;
  }

  syncInFlight = true;

  const child = spawn(process.execPath, [syncScript, appUrl], {
    cwd: root,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    syncInFlight = false;

    if (code === 0) {
      lastSyncedUrl = appUrl;
    }
  });
}

const extraArgs = process.argv.slice(2);
const shopifyArgs = ["app", "dev", "--config", "shopify.app.toml", ...extraArgs];

const dev = spawn("shopify", shopifyArgs, {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--dns-result-order=ipv4first"]
      .filter(Boolean)
      .join(" "),
  },
});

const pollInterval = setInterval(syncAppUrl, 3000);

dev.on("exit", (code) => {
  clearInterval(pollInterval);
  process.exit(code ?? 0);
});

process.on("SIGINT", () => dev.kill("SIGINT"));
process.on("SIGTERM", () => dev.kill("SIGTERM"));
