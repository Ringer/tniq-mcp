import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse, errorResult } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";

export function registerRocTools(server: McpServer, client: TniqClient): void {
  // ─── Read tools ───────────────────────────────────────────────────────────

  server.tool(
    "roc_list_projects",
    "Use when you need to list ROC (Responsible Organization Change) projects for a customer, optionally filtered by direction or status.",
    {
      customerId: z
        .string()
        .describe("The customer ID whose ROC projects to list."),
      direction: z
        .string()
        .optional()
        .describe(
          "Optional direction filter for ROC projects (e.g. 'INBOUND', 'OUTBOUND')."
        ),
      status: z
        .string()
        .optional()
        .describe("Optional status filter for ROC projects (e.g. 'OPEN', 'CLOSED')."),
      page: z
        .number()
        .int()
        .optional()
        .describe("Optional zero-based page number for paginated results."),
      size: z
        .number()
        .int()
        .optional()
        .describe("Optional number of results per page."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ customerId, direction, status, page, size }) => {
      const data = await client.get("/api/v1/roc/projects", {
        customerId,
        direction,
        status,
        page,
        size,
      });
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_get_project",
    "Use when you need to retrieve the full details of a single ROC project by its ID.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project to retrieve."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const data = await client.get(`/api/v1/roc/projects/${projectId}`);
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_get_documents",
    "Use when you need to retrieve the list of documents attached to a ROC project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project whose documents to retrieve."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const data = await client.get(
        `/api/v1/roc/projects/${projectId}/documents`
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_get_details",
    "Use when you need per-TFN (toll-free number) details for a ROC project, such as individual TFN statuses within the project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project whose TFN details to retrieve."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const data = await client.get(
        `/api/v1/roc/projects/${projectId}/details`
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_get_audit",
    "Use when you need to view the audit log for a ROC project, showing all state changes and actions taken.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project whose audit log to retrieve."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const data = await client.get(
        `/api/v1/roc/projects/${projectId}/audit`
      );
      return formatResponse(data);
    }
  );

  // ─── Write tools ──────────────────────────────────────────────────────────

  server.tool(
    "roc_create_project",
    "Use when you need to create a new ROC project to initiate a Responsible Organization Change for one or more toll-free numbers.",
    {
      customerId: z
        .string()
        .describe("The customer ID under which to create the ROC project."),
      entityId: z
        .string()
        .describe("The entity ID associated with the ROC project."),
      newRespOrgId: z
        .string()
        .describe("The resp org ID that will become the new responsible organization."),
      requestType: z
        .string()
        .describe("The type of ROC request (e.g. 'SIMPLE', 'COMPLEX')."),
      tfns: z
        .array(z.string())
        .describe("Array of toll-free numbers (TFNs) to include in the ROC project."),
      effectiveDate: z
        .string()
        .optional()
        .describe("Optional effective date for the ROC in ISO 8601 format (e.g. '2026-01-15')."),
      notes: z
        .string()
        .optional()
        .describe("Optional notes or comments to attach to the ROC project."),
    },
    async ({
      customerId,
      entityId,
      newRespOrgId,
      requestType,
      tfns,
      effectiveDate,
      notes,
    }) => {
      const body: Record<string, unknown> = {
        entityId,
        newRespOrgId,
        requestType,
        tfns,
      };
      if (effectiveDate !== undefined) body.effectiveDate = effectiveDate;
      if (notes !== undefined) body.notes = notes;

      const data = await client.post(
        `/api/v1/roc/projects?customerId=${encodeURIComponent(customerId)}`,
        body
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_submit",
    "Use when you need to submit a ROC project to Somos for processing after it has been created and is ready.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project to submit."),
      respOrgId: z
        .string()
        .describe("The resp org ID submitting the ROC to Somos."),
      contactInformation: z
        .string()
        .optional()
        .describe("Optional contact information to include with the ROC submission."),
    },
    async ({ projectId, respOrgId, contactInformation }) => {
      const body: Record<string, unknown> = { respOrgId };
      if (contactInformation !== undefined)
        body.contactInformation = contactInformation;

      const data = await client.post(
        `/api/v1/roc/projects/${projectId}/submit`,
        body
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_refresh",
    "Use when you need to refresh the status of a ROC project by pulling the latest state from Somos.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project whose status to refresh."),
    },
    async ({ projectId }) => {
      const data = await client.post(
        `/api/v1/roc/projects/${projectId}/refresh`
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_cancel",
    "Use when you need to cancel an open ROC project that has not yet been completed.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project to cancel."),
    },
    async ({ projectId }) => {
      const data = await client.put(`/api/v1/roc/projects/${projectId}/cancel`);
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_remove_tfns",
    "Use when you need to remove specific toll-free numbers from an open ROC transaction before it is submitted or finalized.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project from which to remove TFNs."),
      tfns: z
        .array(z.string())
        .describe("Array of toll-free numbers (TFNs) to remove from the ROC project."),
    },
    async ({ projectId, tfns }) => {
      const data = await client.put(
        `/api/v1/roc/projects/${projectId}/tfns/remove`,
        tfns
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_upload_loa",
    "Use when you need to upload a Letter of Authorization (LOA) file to a ROC project. Pass the multipart form data as a body object.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project to upload the LOA to."),
      body: z
        .record(z.unknown())
        .describe(
          "Passthrough body object representing the multipart form data for the LOA file upload."
        ),
    },
    async ({ projectId, body }) => {
      const data = await client.post(
        `/api/v1/roc/projects/${projectId}/loa/upload`,
        body
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_generate_loa",
    "Use when you need to generate a Letter of Authorization (LOA) from Somos for a ROC project using the provided contact and address details.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project for which to generate the LOA."),
      respOrgId: z
        .string()
        .describe("The resp org ID to associate with the generated LOA."),
      custName: z
        .string()
        .describe("The customer name to appear on the LOA."),
      address1: z
        .string()
        .describe("Primary street address line for the LOA."),
      address2: z
        .string()
        .optional()
        .describe("Optional secondary street address line for the LOA."),
      city: z
        .string()
        .describe("City for the LOA address."),
      state: z
        .string()
        .describe("State abbreviation for the LOA address (e.g. 'TX')."),
      zipCode: z
        .string()
        .describe("ZIP code for the LOA address."),
      contactName: z
        .string()
        .describe("Full name of the contact person on the LOA."),
      contactTitle: z
        .string()
        .describe("Job title of the contact person on the LOA."),
      contactPhone: z
        .string()
        .describe("Phone number of the contact person on the LOA."),
      email: z
        .string()
        .optional()
        .describe("Optional email address of the contact person on the LOA."),
    },
    async ({
      projectId,
      respOrgId,
      custName,
      address1,
      address2,
      city,
      state,
      zipCode,
      contactName,
      contactTitle,
      contactPhone,
      email,
    }) => {
      const body: Record<string, unknown> = {
        respOrgId,
        custName,
        address1,
        city,
        state,
        zipCode,
        contactName,
        contactTitle,
        contactPhone,
      };
      if (address2 !== undefined) body.address2 = address2;
      if (email !== undefined) body.email = email;

      const data = await client.post(
        `/api/v1/roc/projects/${projectId}/loa/generate`,
        body
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_escalate_hdi",
    "Use when you need to escalate a ROC project to the Somos Help Desk for manual intervention.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project to escalate to the Somos Help Desk."),
    },
    async ({ projectId }) => {
      const data = await client.post(
        `/api/v1/roc/projects/${projectId}/escalate-hdi`
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_upload_document",
    "Use when you need to upload an additional supporting document to a ROC project. Pass the multipart form data as a body object.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the ROC project to upload the document to."),
      body: z
        .record(z.unknown())
        .describe(
          "Passthrough body object representing the multipart form data for the document upload."
        ),
    },
    async ({ projectId, body }) => {
      const data = await client.post(
        `/api/v1/roc/projects/${projectId}/documents/upload`,
        body
      );
      return formatResponse(data);
    }
  );

  // ─── Inbound ROC tools ────────────────────────────────────────────────────

  server.tool(
    "roc_inbound_checkout",
    "Use when you need to check out an inbound ROC project to lock it for processing by a specific resp org.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the inbound ROC project to check out."),
      respOrgId: z
        .string()
        .describe("The resp org ID that is checking out the inbound ROC project."),
    },
    async ({ projectId, respOrgId }) => {
      const data = await client.put(
        `/api/v1/roc/inbound/projects/${projectId}/checkout?respOrgId=${encodeURIComponent(respOrgId)}`
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_inbound_checkin",
    "Use when you need to check in an inbound ROC project that was previously checked out, releasing the lock without processing.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the inbound ROC project to check in."),
      respOrgId: z
        .string()
        .describe("The resp org ID that is checking in the inbound ROC project."),
    },
    async ({ projectId, respOrgId }) => {
      const data = await client.put(
        `/api/v1/roc/inbound/projects/${projectId}/checkin?respOrgId=${encodeURIComponent(respOrgId)}`
      );
      return formatResponse(data);
    }
  );

  server.tool(
    "roc_inbound_process",
    "Use when you need to process an inbound ROC project by approving or denying individual TFNs within it.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the inbound ROC project to process."),
      respOrgId: z
        .string()
        .describe("The resp org ID processing the inbound ROC project."),
      actions: z
        .array(
          z.object({
            tfn: z
              .string()
              .describe("The toll-free number to approve or deny."),
            actionCode: z
              .string()
              .describe(
                "The action code to apply to this TFN (e.g. 'APPROVE', 'DENY')."
              ),
            rejectNote: z
              .string()
              .optional()
              .describe("Optional note explaining the reason for rejection, required when denying."),
          })
        )
        .describe("Array of per-TFN actions to apply when processing the inbound ROC."),
    },
    async ({ projectId, respOrgId, actions }) => {
      const data = await client.put(
        `/api/v1/roc/inbound/projects/${projectId}/process`,
        { respOrgId, actions }
      );
      return formatResponse(data);
    }
  );

  // ─── Sync tool ────────────────────────────────────────────────────────────

  server.tool(
    "roc_sync",
    "Use when you need to sync ROC requests from a Somos search into TNIQ, pulling in ROC activity for a given resp org and date range.",
    {
      customerId: z
        .string()
        .describe("The customer ID for which to sync ROC requests."),
      respOrgId: z
        .string()
        .describe("The resp org ID whose ROC activity to sync from Somos."),
      direction: z
        .string()
        .describe("The direction of ROC requests to sync (e.g. 'INBOUND', 'OUTBOUND')."),
      startDate: z
        .string()
        .describe("The start date of the sync window in ISO 8601 format (e.g. '2026-01-01')."),
      endDate: z
        .string()
        .describe("The end date of the sync window in ISO 8601 format (e.g. '2026-01-31')."),
    },
    async ({ customerId, respOrgId, direction, startDate, endDate }) => {
      const data = await client.post("/api/v1/roc/sync", {
        customerId,
        respOrgId,
        direction,
        startDate,
        endDate,
      });
      return formatResponse(data);
    }
  );
}
