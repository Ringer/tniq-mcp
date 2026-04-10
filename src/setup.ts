import { createInterface } from "node:readline/promises";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { execSync, execFileSync } from "node:child_process";
import { stdin, stdout } from "node:process";
import { CONFIG_DIR, CONFIG_FILE } from "./config.js";
import { ICON_DARK_DATA_URI } from "./icons.js";

const REGISTER_URL = "https://ringer.tel";
const API_BASE_URL = "https://soa-api.ringer.tel";

export async function runSetup(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("\n  TNIQ MCP — Setup\n");

  const existing = loadExistingToken();
  if (existing) {
    console.log(`  Found existing API key: ${maskToken(existing)}`);
    const keep = await rl.question("  Keep this key? (Y/n): ");
    if (keep.toLowerCase() !== "n") {
      console.log("\n  ✓ Keeping existing configuration.");
      await registerWithClients(rl, existing);
      rl.close();
      return;
    }
  }

  console.log("  Do you have an API key?\n");
  console.log("  [1] Yes, I have one  → Enter it");
  console.log("  [2] No, I need one   → Opens ringer.tel in browser");
  console.log();

  const choice = await rl.question("  > ");

  switch (choice.trim()) {
    case "1": {
      const token = await rl.question("\n  Enter your API key: ");
      const trimmed = token.trim();
      if (!trimmed) {
        console.log("\n  ✗ No key entered. Exiting.\n");
        rl.close();
        process.exit(1);
      }

      console.log("\n  Validating...");
      const valid = await validateToken(trimmed);
      if (!valid) {
        console.log(
          "  ✗ Token validation failed. The API returned an error."
        );
        console.log("  Check your token and try again.\n");
        rl.close();
        process.exit(1);
      }

      saveToken(trimmed);
      console.log(`  ✓ Token validated`);
      console.log(`  ✓ Saved to ${CONFIG_FILE}`);
      await registerWithClients(rl, trimmed);
      break;
    }

    case "2": {
      console.log(`\n  Opening ${REGISTER_URL} ...\n`);
      await openBrowser(REGISTER_URL);
      console.log(
        "  After creating your account, run `tniq-mcp setup` again.\n"
      );
      break;
    }

    default: {
      console.log("\n  ✗ Invalid choice. Run `tniq-mcp setup` to try again.\n");
      break;
    }
  }

  rl.close();
}

async function registerWithClients(
  rl: ReturnType<typeof createInterface>,
  token: string | null
): Promise<void> {
  const clients = detectMcpClients();

  if (clients.length === 0) {
    console.log("\n  No supported MCP clients detected.\n");
    printManualConfig(token);
    return;
  }

  console.log("\n  Detected MCP clients:\n");
  clients.forEach((c, i) => console.log(`  [${i + 1}] ${c.name}`));
  console.log(`  [A] All of the above`);
  console.log(`  [S] Skip — I'll configure manually`);
  console.log();

  const answer = await rl.question("  Register with which client? > ");
  const trimmed = answer.trim().toUpperCase();

  if (trimmed === "S") {
    printManualConfig(token);
    return;
  }

  const selected =
    trimmed === "A"
      ? clients
      : clients.filter((_, i) => trimmed === String(i + 1));

  if (selected.length === 0) {
    printManualConfig(token);
    return;
  }

  for (const client of selected) {
    const success = client.register(token);
    if (success) {
      console.log(`  ✓ Registered with ${client.name}`);
    } else {
      console.log(`  ✗ Failed to register with ${client.name}`);
    }
  }

  console.log("\n  Done! Restart your MCP client to load the TNIQ tools.\n");
}

interface McpClient {
  name: string;
  register: (token: string | null) => boolean;
}

function detectMcpClients(): McpClient[] {
  const clients: McpClient[] = [];

  if (commandExists("claude")) {
    clients.push({
      name: "Claude Code",
      register: (token) => registerClaudeCode(token),
    });
  }

  const claudeDesktopConfig = getClaudeDesktopConfigPath();
  if (claudeDesktopConfig && existsSync(claudeDesktopConfig)) {
    clients.push({
      name: "Claude Desktop",
      register: (token) => registerJsonConfig(claudeDesktopConfig, token),
    });
  }

  const cursorConfig = getCursorConfigPath();
  if (cursorConfig && existsSync(cursorConfig)) {
    clients.push({
      name: "Cursor",
      register: (token) => registerJsonConfig(cursorConfig, token),
    });
  }

  if (commandExists("codex")) {
    clients.push({
      name: "Codex CLI",
      register: (token) => registerCodex(token),
    });
  }

  const vscodeSettingsPath = getVsCodeSettingsPath();
  if (vscodeSettingsPath && existsSync(vscodeSettingsPath)) {
    clients.push({
      name: "GitHub Copilot (VS Code)",
      register: (token) => registerCopilot(vscodeSettingsPath, token),
    });
  }

  if (isChatGptDesktopInstalled()) {
    clients.push({
      name: "ChatGPT Desktop (manual)",
      register: (token) => {
        console.log("\n  ChatGPT Desktop requires manual setup:");
        console.log("  1. Open ChatGPT Desktop → Settings → Developer Mode");
        console.log("  2. Add a new MCP server with:");
        const { command: serverCmd, args: serverArgs } = getServerCommand();
        console.log(`     Command: ${serverCmd}`);
        if (serverArgs.length > 0) {
          console.log(`     Args: ${serverArgs.join(" ")}`);
        }
        if (token) {
          console.log(`     Env: TNIQ_API_TOKEN=${token}`);
        }
        return true;
      },
    });
  }

  return clients;
}

function registerClaudeCode(token: string | null): boolean {
  try {
    try {
      execSync(`claude mcp remove -s user tniq 2>/dev/null`, {
        stdio: "ignore",
      });
    } catch {
      // ignore
    }

    const args = ["mcp", "add", "-s", "user", "tniq"];
    if (token) {
      args.push("-e", `TNIQ_API_TOKEN=${token}`);
    }
    const { command: serverCmd, args: serverArgs } = getServerCommand();
    args.push("--", serverCmd, ...serverArgs);
    execFileSync("claude", args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function registerCodex(token: string | null): boolean {
  try {
    try {
      execFileSync("codex", ["mcp", "remove", "tniq"], { stdio: "ignore" });
    } catch {
      // ignore
    }

    const args = ["mcp", "add", "tniq"];
    if (token) {
      args.push("--env", `TNIQ_API_TOKEN=${token}`);
    }
    const { command: serverCmd, args: serverArgs } = getServerCommand();
    args.push("--", serverCmd, ...serverArgs);
    execFileSync("codex", args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getCursorConfigPath(): string | null {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return `${home}/.cursor/mcp.json`;
}

function getVsCodeSettingsPath(): string | null {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  switch (process.platform) {
    case "darwin":
      return `${home}/Library/Application Support/Code/User/settings.json`;
    case "win32":
      return `${process.env.APPDATA}/Code/User/settings.json`;
    case "linux":
      return `${home}/.config/Code/User/settings.json`;
    default:
      return null;
  }
}

function registerCopilot(
  settingsPath: string,
  token: string | null
): boolean {
  try {
    let settings: Record<string, unknown> = {};
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    } catch {
      // start fresh
    }

    const key = "github.copilot.chat.mcp.servers";
    if (!settings[key] || typeof settings[key] !== "object") {
      settings[key] = {};
    }

    const servers = settings[key] as Record<string, unknown>;
    const { command, args: serverArgs } = getServerCommand();
    const entry: Record<string, unknown> = {
      command,
      ...(serverArgs.length > 0 ? { args: serverArgs } : {}),
      icon: ICON_DARK_DATA_URI,
    };
    if (token) {
      entry.env = { TNIQ_API_TOKEN: token };
    }
    servers["tniq"] = entry;

    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
    return true;
  } catch {
    return false;
  }
}

function isChatGptDesktopInstalled(): boolean {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  switch (process.platform) {
    case "darwin":
      return existsSync(`${home}/Library/Application Support/com.openai.chat`);
    case "win32":
      return existsSync(`${process.env.LOCALAPPDATA}/Programs/ChatGPT`);
    default:
      return false;
  }
}

function registerJsonConfig(
  configPath: string,
  token: string | null,
  serverKey: string = "tniq"
): boolean {
  try {
    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(readFileSync(configPath, "utf-8"));
    } catch {
      // start fresh
    }

    if (!config.mcpServers || typeof config.mcpServers !== "object") {
      config.mcpServers = {};
    }

    const servers = config.mcpServers as Record<string, unknown>;
    const { command, args: serverArgs } = getServerCommand();
    const entry: Record<string, unknown> = {
      command,
      ...(serverArgs.length > 0 ? { args: serverArgs } : {}),
      icon: ICON_DARK_DATA_URI,
    };
    if (token) {
      entry.env = { TNIQ_API_TOKEN: token };
    }
    servers[serverKey] = entry;

    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    return true;
  } catch {
    return false;
  }
}

function getClaudeDesktopConfigPath(): string | null {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  switch (process.platform) {
    case "darwin":
      return `${home}/Library/Application Support/Claude/claude_desktop_config.json`;
    case "win32":
      return `${process.env.APPDATA}/Claude/claude_desktop_config.json`;
    case "linux":
      return `${home}/.config/Claude/claude_desktop_config.json`;
    default:
      return null;
  }
}

function commandExists(cmd: string): boolean {
  try {
    const check =
      process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`;
    execSync(check, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getServerCommand(): { command: string; args: string[] } {
  if (commandExists("tniq-mcp")) {
    return { command: "tniq-mcp", args: [] };
  }
  return { command: "npx", args: ["-y", "tniq-mcp"] };
}

function loadExistingToken(): string | null {
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    const config = JSON.parse(raw);
    return typeof config.apiToken === "string" ? config.apiToken : null;
  } catch {
    return null;
  }
}

function saveToken(token: string): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const existing = existsSync(CONFIG_FILE)
    ? JSON.parse(readFileSync(CONFIG_FILE, "utf-8"))
    : {};
  existing.apiToken = token;
  writeFileSync(CONFIG_FILE, JSON.stringify(existing, null, 2) + "\n");
}

async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/lnp/soa/events`, {
      headers: { Authorization: "Bearer " + token },
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function maskToken(token: string): string {
  if (token.length <= 8) return "****";
  return token.substring(0, 4) + "..." + token.substring(token.length - 4);
}

async function openBrowser(url: string): Promise<void> {
  const { exec } = await import("node:child_process");
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${cmd} ${url}`);
}

function printManualConfig(token: string | null): void {
  const env: Record<string, string> = {};
  if (token) {
    env["TNIQ_API_TOKEN"] = token;
  }

  const { command, args: serverArgs } = getServerCommand();
  const config = {
    mcpServers: {
      tniq: {
        command,
        ...(serverArgs.length > 0 ? { args: serverArgs } : {}),
        icon: ICON_DARK_DATA_URI,
        ...(token ? { env } : {}),
      },
    },
  };

  console.log("\n  Add this to your MCP client configuration:\n");
  console.log(
    JSON.stringify(config, null, 2)
      .split("\n")
      .map((line) => "  " + line)
      .join("\n")
  );
  console.log();
}
