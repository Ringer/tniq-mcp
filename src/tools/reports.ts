import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse, errorResult } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";

export function registerReportTools(server: McpServer, client: TniqClient): void {
  // ─── Read tools ───────────────────────────────────────────────────────────

  // 1. report_list_jobs — GET /v1/reports/jobs
  server.tool(
    "report_list_jobs",
    "Use this tool when you need to list your recent report jobs and their statuses, optionally limiting how many are returned.",
    {
      limit: z
        .number()
        .int()
        .describe("Optional maximum number of recent report jobs to return (defaults to 20 on the server).")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ limit }) => {
      const result = await client.get("/v1/reports/jobs", { limit });
      return formatResponse(result);
    }
  );

  // 2. report_get_job — GET /v1/reports/jobs/{id}
  server.tool(
    "report_get_job",
    "Use this tool when you need to poll a single report job's status and result by its unique job ID.",
    {
      id: z
        .string()
        .uuid()
        .describe("The UUID of the report job to retrieve the status for."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ id }) => {
      const result = await client.get(`/v1/reports/jobs/${id}`);
      return formatResponse(result);
    }
  );

  // ─── Write tools ──────────────────────────────────────────────────────────

  // 3. report_create_job — POST /v1/reports/jobs
  server.tool(
    "report_create_job",
    "Use this tool when you need to queue a new asynchronous report job, such as a SOA queue snapshot, port-out/port-in report, or inventory spreadsheet export.",
    {
      reportType: z
        .enum(["SOA_QUEUE_SNAPSHOT", "PORT_OUTS", "PORT_INS", "INVENTORY_XLSX"])
        .describe("The type of report to generate: SOA_QUEUE_SNAPSHOT, PORT_OUTS, PORT_INS, or INVENTORY_XLSX."),
      params: z
        .record(z.unknown())
        .describe("Optional report-type-specific parameters object (e.g., date ranges or filters) passed through to the report generator.")
        .optional(),
    },
    async ({ reportType, params }) => {
      const body: Record<string, unknown> = { reportType };
      if (params !== undefined) body.params = params;
      const result = await client.post("/v1/reports/jobs", body);
      return formatResponse(result);
    }
  );
}
