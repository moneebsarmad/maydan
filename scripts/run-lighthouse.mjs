import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const HELP_FLAGS = new Set(["-h", "--help"]);
const DEFAULT_URL = "http://127.0.0.1:3000/dashboard";
const DEFAULT_OUTPUT_DIR = ".lighthouse";
const DEFAULT_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
];

function main() {
  const argv = process.argv.slice(2);

  if (argv.some((arg) => HELP_FLAGS.has(arg))) {
    printHelp();
    return;
  }

  const urlArg = argv.find((arg) => !arg.startsWith("--"));
  const passthroughArgs = argv.filter((arg) => arg !== urlArg);
  const targetUrl = urlArg ?? process.env.LIGHTHOUSE_URL ?? DEFAULT_URL;
  const chromePath = resolveChromePath();
  const outputDir = resolve(process.env.LIGHTHOUSE_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = resolve(outputDir, `lighthouse-${timestamp}.html`);

  if (!chromePath) {
    console.error("No Chrome-compatible browser path found for Lighthouse.");
    console.error(
      "Set LIGHTHOUSE_CHROME_PATH to a browser binary, for example:",
    );
    console.error(
      "LIGHTHOUSE_CHROME_PATH=\"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome\"",
    );
    process.exit(1);
  }

  mkdirSync(outputDir, { recursive: true });

  const localBinary = resolve(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "lighthouse.cmd" : "lighthouse",
  );
  const command = existsSync(localBinary)
    ? localBinary
    : process.platform === "win32"
      ? "npx.cmd"
      : "npx";
  const baseArgs = existsSync(localBinary) ? [] : ["--yes", "lighthouse"];
  const args = [
    ...baseArgs,
    targetUrl,
    "--chrome-path",
    chromePath,
    "--output",
    "html",
    "--output-path",
    outputPath,
    ...passthroughArgs,
  ];

  console.log(`Running Lighthouse against ${targetUrl}`);
  console.log(`Using browser: ${chromePath}`);
  console.log(`Report path: ${outputPath}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

function resolveChromePath() {
  const configuredPath = process.env.LIGHTHOUSE_CHROME_PATH;

  if (configuredPath && existsSync(configuredPath)) {
    return configuredPath;
  }

  for (const browserPath of DEFAULT_CHROME_PATHS) {
    if (existsSync(browserPath)) {
      return browserPath;
    }
  }

  return null;
}

function printHelp() {
  console.log("Usage: npm run lighthouse -- [url] [additional Lighthouse args]");
  console.log("");
  console.log("Environment variables:");
  console.log(
    "  LIGHTHOUSE_CHROME_PATH  Explicit browser binary path for Lighthouse",
  );
  console.log(
    `  LIGHTHOUSE_URL          Default target URL (default: ${DEFAULT_URL})`,
  );
  console.log(
    `  LIGHTHOUSE_OUTPUT_DIR   Report directory (default: ${DEFAULT_OUTPUT_DIR})`,
  );
  console.log("");
  console.log("Examples:");
  console.log(
    "  LIGHTHOUSE_CHROME_PATH=\"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome\" npm run lighthouse",
  );
  console.log(
    "  npm run lighthouse -- http://127.0.0.1:3000/events/new --only-categories=performance,accessibility",
  );
}

main();
