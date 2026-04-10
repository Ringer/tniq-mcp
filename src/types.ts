import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "./client.js";

export type ToolRegistrar = (server: McpServer, client: TniqClient) => void;
