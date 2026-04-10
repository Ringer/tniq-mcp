import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse, errorResult } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";
import { isValidTn } from "../utils/validation.js";

export function registerCnamTools(server: McpServer, client: TniqClient): void {
  // ─── Read tools ───────────────────────────────────────────────────────────

  server.tool(
    "cnam_query",
    "Use when you need to look up the Caller Name ID stored for a telephone number.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number to query the CNAM record for.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ telephoneNumber }) => {
      const data = await client.get(`/api/v1/cnam/query/${telephoneNumber}`);
      return formatResponse(data);
    }
  );

  // ─── Write tools ──────────────────────────────────────────────────────────

  server.tool(
    "cnam_activate",
    "Use when setting or updating the Caller Name displayed for outbound calls on a telephone number.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number to activate or update the CNAM record for.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
      cnam: z
        .string()
        .max(15)
        .describe("Caller name to display on outbound calls, maximum 15 characters."),
      lrn: z
        .string()
        .optional()
        .refine((v) => v === undefined || isValidTn(v), {
          message: "lrn must be exactly 10 digits",
        })
        .describe("Optional 10-digit Location Routing Number associated with the telephone number."),
      privacyIndicator: z
        .string()
        .optional()
        .describe("Optional privacy indicator controlling CNAM display behavior."),
      extendedFirstName: z
        .string()
        .optional()
        .describe("Optional extended first name to store alongside the CNAM record."),
      extendedLastName: z
        .string()
        .optional()
        .describe("Optional extended last name to store alongside the CNAM record."),
      extendedBusinessName: z
        .string()
        .optional()
        .describe("Optional extended business name to store alongside the CNAM record."),
    },
    async ({
      telephoneNumber,
      cnam,
      lrn,
      privacyIndicator,
      extendedFirstName,
      extendedLastName,
      extendedBusinessName,
    }) => {
      const body: Record<string, string> = { telephoneNumber, cnam };
      if (lrn !== undefined) body.lrn = lrn;
      if (privacyIndicator !== undefined) body.privacyIndicator = privacyIndicator;
      if (extendedFirstName !== undefined) body.extendedFirstName = extendedFirstName;
      if (extendedLastName !== undefined) body.extendedLastName = extendedLastName;
      if (extendedBusinessName !== undefined) body.extendedBusinessName = extendedBusinessName;

      const data = await client.post("/api/v1/cnam/activate", body);
      return formatResponse(data);
    }
  );

  server.tool(
    "cnam_delete",
    "Use when removing the Caller Name record for a telephone number from the database.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number whose CNAM record should be deleted.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
    },
    async ({ telephoneNumber }) => {
      const data = await client.delete(`/api/v1/cnam/${telephoneNumber}`);
      return formatResponse(data);
    }
  );
}
