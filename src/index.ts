#!/usr/bin/env node

const subcommand = process.argv[2];

if (subcommand === "setup") {
  const { runSetup } = await import("./setup.js");
  await runSetup();
} else if (!subcommand && process.stdin.isTTY && !process.env.MCP_CLIENT) {
  const { VERSION } = await import("./version.js");
  console.log(`
  tniq-mcp v${VERSION}

  Usage:
    tniq-mcp setup    Interactive setup wizard
    tniq-mcp          MCP server (stdio) — used by MCP clients

  Run 'tniq-mcp setup' to configure your API key and register
  with your MCP clients (Claude, Cursor, Copilot, Codex, ChatGPT).
`);
} else {
  const { McpServer } = await import(
    "@modelcontextprotocol/sdk/server/mcp.js"
  );
  const { StdioServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/stdio.js"
  );
  const { TniqClient } = await import("./client.js");
  const { loadConfig } = await import("./config.js");
  const { registerSoaTools } = await import("./tools/soa.js");
  const { registerTollfreeTools } = await import("./tools/tollfree.js");
  const { registerRocTools } = await import("./tools/roc.js");
  const { registerBulkPortTools } = await import("./tools/bulk-port.js");
  const { registerPortOutTools } = await import("./tools/port-out.js");
  const { registerMessagingTools } = await import("./tools/messaging.js");
  const { registerInventoryTools } = await import("./tools/inventory.js");
  const { registerCnamTools } = await import("./tools/cnam.js");
  const { registerKnowledge, TNIQ_KNOWLEDGE } = await import(
    "./knowledge.js"
  );
  const { ICONS } = await import("./icons.js");
  const { VERSION } = await import("./version.js");

  const config = loadConfig();
  const client = new TniqClient(config);

  const server = new McpServer(
    {
      name: "tniq",
      version: VERSION,
      title: "TNIQ",
      description:
        "TNIQ by Ringer — telecom number porting, toll-free, messaging, inventory, and CNAM APIs",
      icons: ICONS,
      websiteUrl: "https://ringer.tel",
    },
    {
      instructions: TNIQ_KNOWLEDGE,
    }
  );

  registerSoaTools(server, client);
  registerTollfreeTools(server, client);
  registerRocTools(server, client);
  registerBulkPortTools(server, client);
  registerPortOutTools(server, client);
  registerMessagingTools(server, client);
  registerInventoryTools(server, client);
  registerCnamTools(server, client);
  registerKnowledge(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
