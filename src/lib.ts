// Library exports for use by remote MCP servers and other consumers

// Client
export { TniqClient } from "./client.js";
export type { Config } from "./config.js";

// Tool registrars
export { registerSoaTools } from "./tools/soa.js";
export { registerTollfreeTools } from "./tools/tollfree.js";
export { registerRocTools } from "./tools/roc.js";
export { registerBulkPortTools } from "./tools/bulk-port.js";
export { registerPortOutTools } from "./tools/port-out.js";
export { registerMessagingTools } from "./tools/messaging.js";
export { registerInventoryTools } from "./tools/inventory.js";
export { registerCnamTools } from "./tools/cnam.js";

// Knowledge / prompts
export { registerKnowledge, TNIQ_KNOWLEDGE } from "./knowledge.js";

// Metadata
export { ICONS, ICON_LIGHT_DATA_URI, ICON_DARK_DATA_URI } from "./icons.js";
export { VERSION } from "./version.js";

// Annotations
export { READ_ONLY_ANNOTATIONS } from "./annotations.js";

// Types
export type { ToolRegistrar } from "./types.js";
