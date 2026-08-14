import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanupDevProcesses,
  getFreePort,
  killPort,
  runShopifyWithRetries,
  sleep,
} from "./shopify-dev-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const ngrokDomain =
  process.env.NGROK_DOMAIN ?? "circular-tractor-garage.ngrok-free.dev";
const extraArgs = process.argv.slice(2);

let ngrokProcess = null;
let ngrokPort = null;

function stopNgrok() {
  if (ngrokProcess) {
    ngrokProcess.kill("SIGTERM");
    ngrokProcess = null;
  }

  spawnSync("pkill", ["-f", `ngrok http.*${ngrokPort ?? ""}`], {
    stdio: "ignore",
  });
}

async function readNgrokUrl() {
  try {
    const response = await fetch("http://127.0.0.1:4040/api/tunnels", {
      signal: AbortSignal.timeout(2000),
    });
    const payload = await response.json();
    const tunnel = payload.tunnels?.find(
      (entry) =>
        entry.proto === "https" &&
        entry.public_url &&
        entry.config?.addr?.endsWith(`:${ngrokPort}`),
    );

    return tunnel?.public_url?.replace(/\/$/, "") ?? null;
  } catch {
    return null;
  }
}

async function startNgrok(localPort) {
  stopNgrok();
  killPort(4040);

  const args = ngrokDomain
    ? ["http", "--domain", ngrokDomain, String(localPort)]
    : ["http", String(localPort)];

  ngrokProcess = spawn("ngrok", args, {
    cwd: root,
    stdio: "ignore",
    detached: false,
  });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const url = await readNgrokUrl();
    if (url) {
      return url;
    }
    await sleep(500);
  }

  throw new Error(
    "Could not start ngrok. Run `ngrok config check` and verify your auth token.",
  );
}

function shutdown() {
  stopNgrok();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  await cleanupDevProcesses();

  ngrokPort = Number(process.env.SHOPIFY_LOCAL_PORT) || (await getFreePort());
  console.log(`Using local port ${ngrokPort}`);

  const tunnelUrl = await startNgrok(ngrokPort);
  console.log(`Using ngrok tunnel: ${tunnelUrl}\n`);

  const exitCode = await runShopifyWithRetries(
    [
      "app",
      "dev",
      "--config",
      "shopify.app.toml",
      "--localhost-port",
      String(ngrokPort),
      "--tunnel-url",
      `${tunnelUrl}:${ngrokPort}`,
      ...extraArgs,
    ],
    root,
  );

  stopNgrok();
  process.exit(exitCode);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  stopNgrok();
  process.exit(1);
}
