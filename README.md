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
| Toll-Free | `tf_` | 43 | Somos TFN Registry integration |
| ROC | `roc_` | 18 | Responsible Organization Change |
| Bulk Port | `port_` | 34 | Bulk port order management |
| Port-Out Release | `port_out_` | 8 | NPAC release management |
| Port Protection | `port_protect_` | 6 | Port-out protection rules |
| Messaging / 10DLC | `msg_` | 48 | TCR brand/campaign registration, vetting, CNP |
| Number Inventory | `inv_` | 32 | Number search, reserve, assign, disconnect, audit |
| CNAM | `cnam_` | 3 | Caller Name ID management |
| Reports | `report_` | 3 | Async report jobs |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TNIQ_API_TOKEN` | API bearer token | (from `~/.tniq/config.json`) |
| `TNIQ_API_URL` | API URL (`TNIQ_API_BASE_URL` is still accepted for older configs) | `https://api.tniq.ringer.tel/v1` |
| `TNIQ_REQUEST_TIMEOUT_MS` | Request timeout | `30000` |

> **Upgrading from an older version?** The default API host is now
> `https://api.tniq.ringer.tel/v1` (`tniq-api.ringer.tel` remains a working
> alias). If you previously pinned `TNIQ_API_BASE_URL=https://soa-api.ringer.tel`,
> that override still wins and you'll stay on the old host — remove it to pick up
> the new default, or set `TNIQ_API_URL=https://api.tniq.ringer.tel/v1`.

## License

MIT
