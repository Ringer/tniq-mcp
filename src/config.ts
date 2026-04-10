import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface Config {
  baseUrl: string;
  apiToken: string | null;
  requestTimeoutMs: number;
}

const CONFIG_DIR = join(homedir(), ".tniq");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export { CONFIG_DIR, CONFIG_FILE };

function loadTokenFromConfigFile(): string | null {
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    const config = JSON.parse(raw);
    return typeof config.apiToken === "string" ? config.apiToken : null;
  } catch {
    return null;
  }
}

export function loadConfig(): Config {
  const apiToken =
    process.env.TNIQ_API_TOKEN || loadTokenFromConfigFile() || null;

  return {
    baseUrl: process.env.TNIQ_API_BASE_URL || "https://soa-api.ringer.tel",
    apiToken,
    requestTimeoutMs: parseInt(
      process.env.TNIQ_REQUEST_TIMEOUT_MS || "30000",
      10
    ),
  };
}
