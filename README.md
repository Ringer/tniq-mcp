# tniq-mcp

MCP server for [TNIQ by Ringer](https://ringer.tel) — telecom number management, porting, toll-free, messaging, and CNAM APIs.

## Quick Start

```bash
npm install -g tniq-mcp
tniq-mcp setup
```

The setup wizard will:
1. Collect your API key
2. Detect installed MCP clients (Claude, Cursor, Copilot, Codex, ChatGPT)
3. Register the server automatically

## Manual Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "tniq": {
      "command": "tniq-mcp",
      "env": {
        "TNIQ_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

If you prefer not to install globally, use npx:

```json
{
  "mcpServers": {
    "tniq": {
      "command": "npx",
      "args": ["-y", "tniq-mcp"],
      "env": {
        "TNIQ_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Tools

| Group | Prefix | Tools | Description |
|-------|--------|-------|-------------|
| SOA Operations | `soa_` | 15 | NPAC port request lifecycle |
| Toll-Free | `tf_` | 37 | Somos TFN Registry integration |
| ROC | `roc_` | 18 | Responsible Organization Change |
| Bulk Port | `port_` | 34 | Bulk port order management |
| Port-Out Release | `port_out_` | 8 | NPAC release management |
| Messaging / 10DLC | `msg_` | 34 | TCR brand/campaign registration |
| Number Inventory | `inv_` | 30 | Number search, reserve, assign, audit |
| CNAM | `cnam_` | 3 | Caller Name ID management |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TNIQ_API_TOKEN` | API bearer token | (from `~/.tniq/config.json`) |
| `TNIQ_API_BASE_URL` | API base URL | `https://soa-api.ringer.tel` |
| `TNIQ_REQUEST_TIMEOUT_MS` | Request timeout | `30000` |

## License

MIT
