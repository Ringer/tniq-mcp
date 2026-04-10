import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse, errorResult } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";
import { isValidTn, isValidSpid, isValidLrn, isValidRegion } from "../utils/validation.js";

export function registerSoaTools(server: McpServer, client: TniqClient): void {
  // 1. soa_get_status — GET /v1/lnp/soa/status/{tn}
  server.tool(
    "soa_get_status",
    "Use this tool when you need to retrieve the current SOA status of a telephone number (e.g., pending, active, conflict).",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number to check status for.")
        .refine(isValidTn, { message: "tn must be exactly 10 digits" }),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ tn }) => {
      const result = await client.get(`/v1/lnp/soa/status/${tn}`);
      return formatResponse(result);
    }
  );

  // 2. soa_get_spid — GET /v1/lnp/soa/spid/{tn}
  server.tool(
    "soa_get_spid",
    "Use this tool when you need to look up the current Service Provider ID (SPID) associated with a telephone number.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number to retrieve the SPID for.")
        .refine(isValidTn, { message: "tn must be exactly 10 digits" }),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ tn }) => {
      const result = await client.get(`/v1/lnp/soa/spid/${tn}`);
      return formatResponse(result);
    }
  );

  // 3. soa_query — GET /v1/lnp/soa/query/{tn}
  server.tool(
    "soa_query",
    "Use this tool when you need to query the full port status and details for a telephone number.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number to query port status for.")
        .refine(isValidTn, { message: "tn must be exactly 10 digits" }),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ tn }) => {
      const result = await client.get(`/v1/lnp/soa/query/${tn}`);
      return formatResponse(result);
    }
  );

  // 4. soa_get_events — GET /v1/lnp/soa/events
  server.tool(
    "soa_get_events",
    "Use this tool when you need to retrieve pending SOA events, optionally filtered by SPID or region.",
    {
      spid: z
        .string()
        .describe("Optional 4-character Service Provider ID to filter events by.")
        .refine(isValidSpid, { message: "spid must be exactly 4 alphanumeric characters" })
        .optional(),
      region: z
        .string()
        .describe("Optional 4-character region code to filter events by.")
        .refine(isValidRegion, { message: "region must be exactly 4 alphanumeric characters" })
        .optional(),
      limit: z
        .number()
        .int()
        .describe("Optional maximum number of events to return.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ spid, region, limit }) => {
      const result = await client.get("/v1/lnp/soa/events", { spid, region, limit });
      return formatResponse(result);
    }
  );

  // 5. soa_get_activation_ready — GET /v1/lnp/soa/activation-ready/{newspid}
  server.tool(
    "soa_get_activation_ready",
    "Use this tool when you need to list telephone numbers that are ready for activation under a given new SPID.",
    {
      newspid: z
        .string()
        .describe("The 4-character Service Provider ID of the gaining carrier to check activation-ready numbers for.")
        .refine(isValidSpid, { message: "newspid must be exactly 4 alphanumeric characters" }),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ newspid }) => {
      const result = await client.get(`/v1/lnp/soa/activation-ready/${newspid}`);
      return formatResponse(result);
    }
  );

  // 6. soa_activate — POST /v1/lnp/soa/activate
  server.tool(
    "soa_activate",
    "Use this tool when you need to activate a ported telephone number after the port-in process is complete.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number to activate.")
        .refine(isValidTn, { message: "tn must be exactly 10 digits" }),
      newspid: z
        .string()
        .describe("Optional 4-character Service Provider ID of the gaining carrier.")
        .refine(isValidSpid, { message: "newspid must be exactly 4 alphanumeric characters" })
        .optional(),
      region: z
        .string()
        .describe("Optional 4-character region code where the activation applies.")
        .refine(isValidRegion, { message: "region must be exactly 4 alphanumeric characters" })
        .optional(),
    },
    async ({ tn, newspid, region }) => {
      const body: Record<string, string> = { tn };
      if (newspid !== undefined) body.newspid = newspid;
      if (region !== undefined) body.region = region;
      const result = await client.post("/v1/lnp/soa/activate", body);
      return formatResponse(result);
    }
  );

  // 7. soa_cancel — POST /v1/lnp/soa/cancel
  server.tool(
    "soa_cancel",
    "Use this tool when you need to cancel an in-progress port request for a telephone number.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number whose port request should be cancelled.")
        .refine(isValidTn, { message: "tn must be exactly 10 digits" }),
      newspid: z
        .string()
        .describe("The 4-character Service Provider ID of the gaining carrier that initiated the port.")
        .refine(isValidSpid, { message: "newspid must be exactly 4 alphanumeric characters" }),
    },
    async ({ tn, newspid }) => {
      const result = await client.post("/v1/lnp/soa/cancel", { tn, newspid });
      return formatResponse(result);
    }
  );

  // 8. soa_release — POST /v1/lnp/soa/release
  server.tool(
    "soa_release",
    "Use this tool when you need to release a port request, transferring the number from the old SPID to the new SPID on a scheduled date.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number to release.")
        .refine(isValidTn, { message: "tn must be exactly 10 digits" }),
      oldspid: z
        .string()
        .describe("The 4-character Service Provider ID of the losing carrier.")
        .refine(isValidSpid, { message: "oldspid must be exactly 4 alphanumeric characters" }),
      newspid: z
        .string()
        .describe("The 4-character Service Provider ID of the gaining carrier.")
        .refine(isValidSpid, { message: "newspid must be exactly 4 alphanumeric characters" }),
      ddd: z
        .string()
        .describe("The due date for the port release in ISO 8601 date format (e.g., 2025-06-15)."),
      region: z
        .string()
        .describe("Optional 4-character region code where the release applies.")
        .refine(isValidRegion, { message: "region must be exactly 4 alphanumeric characters" })
        .optional(),
    },
    async ({ tn, oldspid, newspid, ddd, region }) => {
      const body: Record<string, string> = { tn, oldspid, newspid, ddd };
      if (region !== undefined) body.region = region;
      const result = await client.post("/v1/lnp/soa/release", body);
      return formatResponse(result);
    }
  );

  // 9. soa_disconnect — POST /v1/lnp/soa/disconnect
  server.tool(
    "soa_disconnect",
    "Use this tool when you need to disconnect a telephone number from the network, removing it from active service.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number to disconnect.")
        .refine(isValidTn, { message: "tn must be exactly 10 digits" }),
      spid: z
        .string()
        .describe("The 4-character Service Provider ID that owns the number.")
        .refine(isValidSpid, { message: "spid must be exactly 4 alphanumeric characters" }),
      region: z
        .string()
        .describe("Optional 4-character region code where the disconnect applies.")
        .refine(isValidRegion, { message: "region must be exactly 4 alphanumeric characters" })
        .optional(),
    },
    async ({ tn, spid, region }) => {
      const body: Record<string, string> = { tn, spid };
      if (region !== undefined) body.region = region;
      const result = await client.post("/v1/lnp/soa/disconnect", body);
      return formatResponse(result);
    }
  );

  // 10. soa_create_conflict — POST /v1/lnp/soa/conflict/create
  server.tool(
    "soa_create_conflict",
    "Use this tool when you need to raise a conflict on a port request for a telephone number.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number to create a conflict for.")
        .refine(isValidTn, { message: "tn must be exactly 10 digits" }),
    },
    async ({ tn }) => {
      const result = await client.post("/v1/lnp/soa/conflict/create", { tn });
      return formatResponse(result);
    }
  );

  // 11. soa_remove_conflict — POST /v1/lnp/soa/conflict/remove
  server.tool(
    "soa_remove_conflict",
    "Use this tool when you need to remove or resolve an existing conflict on a port request for a telephone number.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number whose conflict should be removed.")
        .refine(isValidTn, { message: "tn must be exactly 10 digits" }),
    },
    async ({ tn }) => {
      const result = await client.post("/v1/lnp/soa/conflict/remove", { tn });
      return formatResponse(result);
    }
  );

  // 12. soa_intrasp — POST /v1/lnp/soa/intrasp
  server.tool(
    "soa_intrasp",
    "Use this tool when you need to perform an intra-service-provider (IntraSP) transfer, moving a number to a new LRN within the same provider.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number to transfer.")
        .refine(isValidTn, { message: "tn must be exactly 10 digits" }),
      lrn: z
        .string()
        .describe("The 10-digit Location Routing Number (LRN) to assign to the telephone number.")
        .refine(isValidLrn, { message: "lrn must be exactly 10 digits" }),
      newspid: z
        .string()
        .describe("The 4-character Service Provider ID of the gaining carrier for this IntraSP transfer.")
        .refine(isValidSpid, { message: "newspid must be exactly 4 alphanumeric characters" }),
      ddd: z
        .string()
        .describe("Optional due date for the IntraSP transfer in ISO 8601 date format (e.g., 2025-06-15).")
        .optional(),
      region: z
        .string()
        .describe("Optional 4-character region code where the transfer applies.")
        .refine(isValidRegion, { message: "region must be exactly 4 alphanumeric characters" })
        .optional(),
    },
    async ({ tn, lrn, newspid, ddd, region }) => {
      const body: Record<string, string> = { tn, lrn, newspid };
      if (ddd !== undefined) body.ddd = ddd;
      if (region !== undefined) body.region = region;
      const result = await client.post("/v1/lnp/soa/intrasp", body);
      return formatResponse(result);
    }
  );

  // 13. soa_create_lrn — POST /v1/lnp/soa/lrn/create
  server.tool(
    "soa_create_lrn",
    "Use this tool when you need to create (assign) a new LRN for a telephone number under a specific SPID and region.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number (LRN) to create.")
        .refine(isValidLrn, { message: "tn must be exactly 10 digits" }),
      newspid: z
        .string()
        .describe("The 4-character Service Provider ID that will own the LRN.")
        .refine(isValidSpid, { message: "newspid must be exactly 4 alphanumeric characters" }),
      region: z
        .string()
        .describe("The 4-character region code where the LRN is being created.")
        .refine(isValidRegion, { message: "region must be exactly 4 alphanumeric characters" }),
    },
    async ({ tn, newspid, region }) => {
      const result = await client.post("/v1/lnp/soa/lrn/create", { tn, newspid, region });
      return formatResponse(result);
    }
  );

  // 14. soa_remove_lrn — POST /v1/lnp/soa/lrn/remove
  server.tool(
    "soa_remove_lrn",
    "Use this tool when you need to remove (deassign) an existing LRN from a telephone number under a specific SPID and region.",
    {
      tn: z
        .string()
        .describe("The 10-digit telephone number (LRN) to remove.")
        .refine(isValidLrn, { message: "tn must be exactly 10 digits" }),
      newspid: z
        .string()
        .describe("The 4-character Service Provider ID that currently owns the LRN.")
        .refine(isValidSpid, { message: "newspid must be exactly 4 alphanumeric characters" }),
      region: z
        .string()
        .describe("The 4-character region code where the LRN is being removed.")
        .refine(isValidRegion, { message: "region must be exactly 4 alphanumeric characters" }),
    },
    async ({ tn, newspid, region }) => {
      const result = await client.post("/v1/lnp/soa/lrn/remove", { tn, newspid, region });
      return formatResponse(result);
    }
  );

  // 15. soa_acknowledge_event — POST /v1/lnp/soa/events/{recno}/acknowledge
  server.tool(
    "soa_acknowledge_event",
    "Use this tool when you need to acknowledge a SOA event after processing it, confirming receipt and clearing it from the queue.",
    {
      recno: z
        .string()
        .describe("The record number of the SOA event to acknowledge."),
    },
    async ({ recno }) => {
      const result = await client.post(`/v1/lnp/soa/events/${recno}/acknowledge`);
      return formatResponse(result);
    }
  );
}
