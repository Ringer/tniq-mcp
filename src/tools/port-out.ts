import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse, errorResult } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";

export function registerPortOutTools(server: McpServer, client: TniqClient): void {
  // 1. port_out_list_projects — GET /api/v1/port-out-releases/projects
  server.tool(
    "port_out_list_projects",
    "Use this tool when you need to list all port-out release projects for a customer.",
    {
      customerId: z
        .string()
        .describe("The UUID of the customer whose port-out release projects to list."),
      page: z
        .number()
        .int()
        .describe("Optional page number for paginated results.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of results per page.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ customerId, page, size }) => {
      const result = await client.get("/api/v1/port-out-releases/projects", {
        customerId,
        page,
        size,
      });
      return formatResponse(result);
    }
  );

  // 2. port_out_get_project — GET /api/v1/port-out-releases/projects/{projectId}
  server.tool(
    "port_out_get_project",
    "Use this tool when you need to retrieve the details of a specific port-out release project by its ID.",
    {
      projectId: z
        .string()
        .describe("The ID of the port-out release project to retrieve."),
      customerId: z
        .string()
        .describe("The UUID of the customer that owns the project."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId, customerId }) => {
      const result = await client.get(
        `/api/v1/port-out-releases/projects/${projectId}`,
        { customerId }
      );
      return formatResponse(result);
    }
  );

  // 3. port_out_create_project — POST /api/v1/port-out-releases/projects
  server.tool(
    "port_out_create_project",
    "Use this tool when you need to create a new port-out release project to release telephone numbers to a gaining carrier.",
    {
      customerId: z
        .string()
        .describe("Customer UUID identifying the account under which the project is created."),
      sourceSpid: z
        .string()
        .describe("Source SPID releasing numbers — the 4-character Service Provider ID of the losing carrier."),
      gainingSpid: z
        .string()
        .describe("Gaining carrier SPID — the 4-character Service Provider ID of the carrier receiving the numbers."),
      name: z
        .string()
        .describe("Optional human-readable name for the port-out release project.")
        .optional(),
      tns: z
        .array(
          z.object({
            tn: z
              .string()
              .describe("10-digit telephone number to include in the port-out release."),
            accountNumber: z
              .string()
              .describe("Optional account number associated with this telephone number.")
              .optional(),
            endUserName: z
              .string()
              .describe("Optional end-user name associated with this telephone number.")
              .optional(),
            streetNum: z
              .string()
              .describe("Optional street number of the end-user service address.")
              .optional(),
            streetName: z
              .string()
              .describe("Optional street name of the end-user service address.")
              .optional(),
            streetType: z
              .string()
              .describe("Optional street type (e.g., Ave, Blvd) of the end-user service address.")
              .optional(),
            city: z
              .string()
              .describe("Optional city of the end-user service address.")
              .optional(),
            state: z
              .string()
              .describe("Optional two-letter state code of the end-user service address.")
              .optional(),
            postalCode: z
              .string()
              .describe("Optional postal/ZIP code of the end-user service address.")
              .optional(),
            pin: z
              .string()
              .describe("Optional PIN or passcode for the account.")
              .optional(),
            npacRegion: z
              .string()
              .describe("Optional NPAC region code governing this telephone number.")
              .optional(),
          })
        )
        .describe("List of telephone numbers to include in the port-out release project, each with optional subscriber details."),
    },
    async ({ customerId, sourceSpid, gainingSpid, name, tns }) => {
      const body: Record<string, unknown> = { customerId, sourceSpid, gainingSpid, tns };
      if (name !== undefined) body.name = name;
      const result = await client.post("/api/v1/port-out-releases/projects", body);
      return formatResponse(result);
    }
  );

  // 4. port_out_get_details — GET /api/v1/port-out-releases/projects/{projectId}/details
  server.tool(
    "port_out_get_details",
    "Use this tool when you need to retrieve the telephone numbers and their details within a specific port-out release project.",
    {
      projectId: z
        .string()
        .describe("The ID of the port-out release project whose TN details to retrieve."),
      customerId: z
        .string()
        .describe("The UUID of the customer that owns the project."),
      page: z
        .number()
        .int()
        .describe("Optional page number for paginated results.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of results per page.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId, customerId, page, size }) => {
      const result = await client.get(
        `/api/v1/port-out-releases/projects/${projectId}/details`,
        { customerId, page, size }
      );
      return formatResponse(result);
    }
  );

  // 5. port_out_update_tn — PUT /api/v1/port-out-releases/projects/{projectId}/details/{tn}
  server.tool(
    "port_out_update_tn",
    "Use this tool when you need to update the subscriber details for a specific telephone number within a port-out release project.",
    {
      projectId: z
        .string()
        .describe("The ID of the port-out release project containing the telephone number."),
      tn: z
        .string()
        .describe("The 10-digit telephone number whose details should be updated."),
      customerId: z
        .string()
        .describe("The UUID of the customer that owns the project."),
      details: z
        .record(z.unknown())
        .describe("PortProjectDetail fields to update — any subscriber or address fields for the TN (e.g., accountNumber, endUserName, streetNum, streetName, streetType, city, state, postalCode, pin, npacRegion)."),
    },
    async ({ projectId, tn, customerId, details }) => {
      const params = new URLSearchParams({ customerId });
      const result = await client.put(
        `/api/v1/port-out-releases/projects/${projectId}/details/${tn}?${params}`,
        details
      );
      return formatResponse(result);
    }
  );

  // 6. port_out_submit — POST /api/v1/port-out-releases/projects/{projectId}/submit
  server.tool(
    "port_out_submit",
    "Use this tool when you need to submit a port-out release project to NPAC, initiating the release of telephone numbers to the gaining carrier on the specified due date.",
    {
      projectId: z
        .string()
        .describe("The ID of the port-out release project to submit."),
      customerId: z
        .string()
        .describe("The UUID of the customer that owns the project."),
      dueDate: z
        .string()
        .describe("The scheduled due date for the port-out release in ISO 8601 format (e.g., 2025-06-15)."),
    },
    async ({ projectId, customerId, dueDate }) => {
      const params = new URLSearchParams({ customerId, dueDate });
      const result = await client.post(
        `/api/v1/port-out-releases/projects/${projectId}/submit?${params}`
      );
      return formatResponse(result);
    }
  );

  // 7. port_out_retry — POST /api/v1/port-out-releases/projects/{projectId}/retry
  server.tool(
    "port_out_retry",
    "Use this tool when you need to retry previously failed telephone numbers in a port-out release project, resubmitting them to NPAC on the specified due date.",
    {
      projectId: z
        .string()
        .describe("The ID of the port-out release project whose failed TNs should be retried."),
      customerId: z
        .string()
        .describe("The UUID of the customer that owns the project."),
      dueDate: z
        .string()
        .describe("The rescheduled due date for the retry submission in ISO 8601 format (e.g., 2025-06-15)."),
    },
    async ({ projectId, customerId, dueDate }) => {
      const params = new URLSearchParams({ customerId, dueDate });
      const result = await client.post(
        `/api/v1/port-out-releases/projects/${projectId}/retry?${params}`
      );
      return formatResponse(result);
    }
  );

  // 8. port_out_lookup — POST /api/v1/port-out-releases/lookup
  server.tool(
    "port_out_lookup",
    "Use this tool when you need to look up the port-out release status and eligibility of one or more telephone numbers before creating or submitting a port-out release project.",
    {
      customerId: z
        .string()
        .describe("The UUID of the customer performing the lookup."),
      tns: z
        .array(z.string())
        .describe("List of 10-digit telephone numbers to look up for port-out release eligibility."),
    },
    async ({ customerId, tns }) => {
      const params = new URLSearchParams({ customerId });
      const result = await client.post(
        `/api/v1/port-out-releases/lookup?${params}`,
        { tns }
      );
      return formatResponse(result);
    }
  );
}
