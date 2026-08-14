import { spawn, spawnSync } from "node:child_process";
import net from "node:net";

const DEV_PORTS = [3000, 3457, 3458, 9293];

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shopifyEnv() {
  return {
    ...process.env,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--dns-result-order=ipv4first"]
      .filter(Boolean)
      .join(" "),
  };
}

export function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
    server.on("error", reject);
  });
}

function killPids(pids) {
  for (const pid of pids) {
    if (!pid) {
      continue;
    }
    try {
      process.kill(Number(pid), "SIGTERM");
    } catch {
      // process already exited
    }
  }
}

export function killPort(port) {
  const result = spawnSync("lsof", ["-ti", `:${port}`], {
    encoding: "utf8",
  });

  if (result.status !== 0 || !result.stdout.trim()) {
    return;
  }

  killPids(result.stdout.trim().split("\n"));
}

export async function cleanupDevProcesses() {
  spawnSync("pkill", ["-f", "shopify app dev"], { stdio: "ignore" });

  for (const port of DEV_PORTS) {
    killPort(port);
  }

  await sleep(1000);
}

export async function waitForShopifyNetwork(maxAttempts = 8) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(
        "https://app.shopify.com/app_management/unstable/graphql.json",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"query":"{ __typename }"}',
          signal: AbortSignal.timeout(15000),
        },
      );

      if (response.status < 500) {
        return;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown network error";

      if (attempt === maxAttempts) {
        throw new Error(
          `Shopify is unreachable after ${maxAttempts} attempts (${message}). Check your internet connection, then retry pnpm dev.`,
        );
      }

      console.log(
        `\nShopify network check failed (${attempt}/${maxAttempts}): ${message}`,
      );
      console.log("Retrying in 5 seconds...\n");
      await sleep(5000);
    }
  }
}

export function runShopify(args, cwd) {
  return spawn("shopify", args, {
    cwd,
    stdio: "inherit",
    env: shopifyEnv(),
  });
}

export async function runShopifyWithRetries(args, cwd, maxAttempts = 3) {
  await waitForShopifyNetwork();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await cleanupDevProcesses();

    const exitCode = await new Promise((resolve) => {
      const child = runShopify(args, cwd);
      child.on("exit", (code) => resolve(code ?? 1));
    });

    if (exitCode === 0) {
      return 0;
    }

    if (attempt < maxAttempts) {
      console.log(
        `\nshopify app dev failed (attempt ${attempt}/${maxAttempts}). Retrying in 5 seconds...\n`,
      );
      await sleep(5000);
      await waitForShopifyNetwork(3);
    } else {
      return exitCode;
    }
  }

  return 1;
}
