# Installation

## Recommended: global install + setup

```bash
npm install -g tniq-mcp
tniq-mcp setup
```

The `setup` wizard collects your API key, detects installed MCP clients
(Claude, Cursor, Copilot, Codex, ChatGPT), and registers the server for you.

If you prefer not to install globally, the per-client instructions below use
`npx -y tniq-mcp` instead.

## Per-client instructions

### Claude Code

```bash
claude mcp add -s user tniq -e TNIQ_API_TOKEN=your-token -- npx -y tniq-mcp
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tniq": {
      "command": "npx",
      "args": ["-y", "tniq-mcp"],
      "env": {
        "TNIQ_API_TOKEN": "your-token"
      }
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "tniq": {
      "command": "npx",
      "args": ["-y", "tniq-mcp"],
      "env": {
        "TNIQ_API_TOKEN": "your-token"
      }
    }
  }
}
```

### GitHub Copilot (VS Code)

Add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "tniq": {
      "command": "npx",
      "args": ["-y", "tniq-mcp"],
      "env": {
        "TNIQ_API_TOKEN": "your-token"
      }
    }
  }
}
```

### Codex CLI

```bash
codex mcp add tniq --env TNIQ_API_TOKEN=your-token -- npx -y tniq-mcp
```

### ChatGPT Desktop

1. Open ChatGPT Desktop → Settings → Developer Mode
2. Add a new MCP server:
   - Command: `npx`
   - Args: `-y tniq-mcp`
   - Env: `TNIQ_API_TOKEN=your-token`
