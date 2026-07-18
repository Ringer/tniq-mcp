import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";
import { isValidSpid } from "../utils/validation.js";

// Appended to every reference-data tool description. This surface is
// credentialed, read-only reference data and establishes none of routing,
// entitlement, current toll-free ownership, or current TN SPID.
const CREDENTIAL_NOTE =
  " Credentialed read-only reference data; does not establish routing, " +
  "entitlement, current toll-free ownership, or current TN SPID.";

const pageField = z
  .number()
  .int()
  .min(0)
  .optional()
  .describe("Zero-based page number (default 0).");

const sizeField = z
  .number()
  .int()
  .min(1)
  .max(200)
  .optional()
  .describe("Page size, 1–200 (default 50).");

const activeField = z
  .boolean()
  .optional()
  .describe("Filter by active (true) vs retired (false) records.");

export function registerReferenceDataTools(
  server: McpServer,
  client: TniqClient
): void {
  // ─── CIC (NANPA Feature Group D Carrier Identification Codes) ──────────────

  server.tool(
    "ref_search_cics",
    "Use when you need to search NANPA Feature Group D CIC (Carrier " +
      "Identification Code) assignments by carrier name, code, or status." +
      CREDENTIAL_NOTE,
    {
      search: z
        .string()
        .optional()
        .describe("Free-text search across CIC code and assignee name."),
      status: z.string().optional().describe("Filter by record status."),
      active: activeField,
      page: pageField,
      size: sizeField,
    },
    READ_ONLY_ANNOTATIONS,
    async ({ search, status, active, page, size }) => {
      const data = await client.get("/v1/reference-data/cics", {
        search,
        status,
        active,
        page,
        size,
      });
      return formatResponse(data);
    }
  );

  server.tool(
    "ref_get_cic",
    "Use when you need the full assignment detail for a single NANPA Feature " +
      "Group D CIC, including assignee and published contact address." +
      CREDENTIAL_NOTE,
    {
      cic: z
        .string()
        .describe("The CIC (Carrier Identification Code) to inspect."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ cic }) => {
      const data = await client.get(
        `/v1/reference-data/cics/${encodeURIComponent(cic)}`
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "ref_resolve_cics",
    "Use when you need to resolve up to 100 distinct CICs to their assignee " +
      "identities in one bounded, non-mutating request." +
      CREDENTIAL_NOTE,
    {
      cics: z
        .array(z.string())
        .min(1)
        .max(100)
        .describe("Distinct CIC codes to resolve, 1–100 items."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ cics }) => {
      const data = await client.post("/v1/reference-data/cics/resolve", {
        cics,
      });
      return formatResponse(data);
    }
  );

  // ─── NNID (published NetNumber GCMR directory — the GLOBAL reference
  //     directory, distinct from account-configured messaging NNIDs) ──────────

  server.tool(
    "ref_search_nnids",
    "Use when you need to search the published NetNumber GCMR NNID directory " +
      "(the global reference directory of network node IDs) by company or " +
      "brand name, service type, or country. This is the global reference " +
      "directory — NOT the account-configured messaging NNIDs managed by the " +
      "msg_* tools." +
      CREDENTIAL_NOTE,
    {
      search: z
        .string()
        .optional()
        .describe("Free-text search across NNID, company, and brand name."),
      serviceType: z
        .string()
        .optional()
        .describe("Filter by service type."),
      countryIso2: z
        .string()
        .optional()
        .describe("Filter by ISO 3166-1 alpha-2 country code, e.g. 'US'."),
      active: activeField,
      page: pageField,
      size: sizeField,
      sort: z
        .string()
        .optional()
        .describe("Sort spec, e.g. 'nnid,asc' (default)."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ search, serviceType, countryIso2, active, page, size, sort }) => {
      const data = await client.get("/v1/reference-data/nnids", {
        search,
        serviceType,
        countryIso2,
        active,
        page,
        size,
        sort,
      });
      return formatResponse(data);
    }
  );

  server.tool(
    "ref_get_nnid",
    "Use when you need the full published NetNumber GCMR directory record for " +
      "a single NNID, including its mobile networks. This is a global " +
      "reference-directory record, not an account-configured messaging NNID." +
      CREDENTIAL_NOTE,
    {
      nnid: z
        .string()
        .describe("The NNID (network node ID) to inspect in the GCMR directory."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ nnid }) => {
      const data = await client.get(
        `/v1/reference-data/nnids/${encodeURIComponent(nnid)}`
      );
      return formatResponse(data);
    }
  );
}
