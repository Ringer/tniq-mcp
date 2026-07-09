import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse, errorResult } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";

export function registerPortProtectionTools(server: McpServer, client: TniqClient): void {
  // ─── Read tools ───────────────────────────────────────────────────────────

  // 1. port_protect_list_rules — GET /v1/port-protection-rules
  server.tool(
    "port_protect_list_rules",
    "Use this tool when you need to list the configured port protection rules that govern whether telephone numbers can be ported out, optionally scoped to a specific customer.",
    {
      customerId: z
        .string()
        .uuid()
        .describe("Optional customer UUID to scope the listed port protection rules to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ customerId }) => {
      const result = await client.get("/v1/port-protection-rules", { customerId });
      return formatResponse(result);
    }
  );

  // 2. port_protect_get_effective — GET /v1/port-protection-rules/effective
  server.tool(
    "port_protect_get_effective",
    "Use this tool when you need to determine the effective port protection rule that applies to a specific telephone number, taking precedence across customer, SPID, and TN scopes into account.",
    {
      tn: z
        .string()
        .describe("The telephone number to resolve the effective port protection rule for."),
      customerId: z
        .string()
        .uuid()
        .describe("Optional customer UUID to scope the effective rule resolution to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ tn, customerId }) => {
      const result = await client.get("/v1/port-protection-rules/effective", { tn, customerId });
      return formatResponse(result);
    }
  );

  // 3. port_protect_get_rule — GET /v1/port-protection-rules/{ruleId}
  server.tool(
    "port_protect_get_rule",
    "Use this tool when you need to retrieve the full details of a single port protection rule by its unique rule ID.",
    {
      ruleId: z
        .string()
        .uuid()
        .describe("The UUID of the port protection rule to retrieve."),
      customerId: z
        .string()
        .uuid()
        .describe("Optional customer UUID to scope the lookup to a specific customer.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ ruleId, customerId }) => {
      const result = await client.get(`/v1/port-protection-rules/${ruleId}`, { customerId });
      return formatResponse(result);
    }
  );

  // ─── Write tools ──────────────────────────────────────────────────────────

  // 4. port_protect_create_rule — POST /v1/port-protection-rules
  server.tool(
    "port_protect_create_rule",
    "Use this tool when you need to create a new port protection rule that controls how port-out requests are handled for a customer, SPID, or individual telephone number.",
    {
      scope: z
        .enum(["CUSTOMER", "SPID", "TN"])
        .describe("The scope the rule applies to: CUSTOMER (whole customer), SPID (a service provider), or TN (a single telephone number)."),
      action: z
        .enum(["BLOCK", "ALLOW", "REQUIRE_APPROVAL", "REQUIRE_PIN", "HOLD_PERIOD"])
        .describe("The action to enforce when the rule matches: BLOCK, ALLOW, REQUIRE_APPROVAL, REQUIRE_PIN, or HOLD_PERIOD."),
      target: z
        .string()
        .max(32)
        .describe("Optional target identifier the rule applies to (e.g., the SPID or telephone number), depending on the chosen scope. Max 32 characters.")
        .optional(),
      holdPeriodHours: z
        .number()
        .int()
        .min(1)
        .max(168)
        .describe("Optional hold period in hours (1-168) used when action is HOLD_PERIOD.")
        .optional(),
      pin: z
        .string()
        .max(255)
        .describe("Optional PIN required to authorize a port-out when action is REQUIRE_PIN. Max 255 characters.")
        .optional(),
      reason: z
        .string()
        .max(4000)
        .describe("Optional free-text reason documenting why the rule was created. Max 4000 characters.")
        .optional(),
      expiresAt: z
        .string()
        .datetime()
        .describe("Optional ISO 8601 date-time at which the rule expires and stops being enforced.")
        .optional(),
      customerId: z
        .string()
        .uuid()
        .describe("Optional customer UUID to scope the rule creation to a specific customer.")
        .optional(),
    },
    async ({ scope, action, target, holdPeriodHours, pin, reason, expiresAt, customerId }) => {
      const body: Record<string, unknown> = { scope, action };
      if (target !== undefined) body.target = target;
      if (holdPeriodHours !== undefined) body.holdPeriodHours = holdPeriodHours;
      if (pin !== undefined) body.pin = pin;
      if (reason !== undefined) body.reason = reason;
      if (expiresAt !== undefined) body.expiresAt = expiresAt;
      const result = await client.post("/v1/port-protection-rules", body, { customerId });
      return formatResponse(result);
    }
  );

  // 5. port_protect_update_rule — PUT /v1/port-protection-rules/{ruleId}
  server.tool(
    "port_protect_update_rule",
    "Use this tool when you need to update an existing port protection rule, such as changing its enforced action, hold period, reason, or expiration.",
    {
      ruleId: z
        .string()
        .uuid()
        .describe("The UUID of the port protection rule to update."),
      action: z
        .enum(["BLOCK", "ALLOW", "REQUIRE_APPROVAL", "REQUIRE_PIN", "HOLD_PERIOD"])
        .describe("The action to enforce when the rule matches: BLOCK, ALLOW, REQUIRE_APPROVAL, REQUIRE_PIN, or HOLD_PERIOD."),
      holdPeriodHours: z
        .number()
        .int()
        .min(1)
        .max(168)
        .describe("Optional hold period in hours (1-168) used when action is HOLD_PERIOD.")
        .optional(),
      reason: z
        .string()
        .max(4000)
        .describe("Optional free-text reason documenting why the rule was updated. Max 4000 characters.")
        .optional(),
      expiresAt: z
        .string()
        .datetime()
        .describe("Optional ISO 8601 date-time at which the rule expires and stops being enforced.")
        .optional(),
      customerId: z
        .string()
        .uuid()
        .describe("Optional customer UUID to scope the update to a specific customer.")
        .optional(),
    },
    async ({ ruleId, action, holdPeriodHours, reason, expiresAt, customerId }) => {
      const body: Record<string, unknown> = { action };
      if (holdPeriodHours !== undefined) body.holdPeriodHours = holdPeriodHours;
      if (reason !== undefined) body.reason = reason;
      if (expiresAt !== undefined) body.expiresAt = expiresAt;
      const result = await client.put(`/v1/port-protection-rules/${ruleId}`, body, { customerId });
      return formatResponse(result);
    }
  );

  // 6. port_protect_delete_rule — DELETE /v1/port-protection-rules/{ruleId}
  server.tool(
    "port_protect_delete_rule",
    "Use this tool when you need to delete an existing port protection rule by its unique rule ID.",
    {
      ruleId: z
        .string()
        .uuid()
        .describe("The UUID of the port protection rule to delete."),
      customerId: z
        .string()
        .uuid()
        .describe("Optional customer UUID to scope the deletion to a specific customer.")
        .optional(),
    },
    async ({ ruleId, customerId }) => {
      const result = await client.delete(`/v1/port-protection-rules/${ruleId}`, { customerId });
      return formatResponse(result);
    }
  );
}
