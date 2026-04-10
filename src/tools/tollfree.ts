import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse, errorResult } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";

// ---------------------------------------------------------------------------
// Shared template body fields (reused across create/update)
// ---------------------------------------------------------------------------
const templateBodyFields = {
  effDtTm: z
    .string()
    .describe("Effective date/time for this template version (ISO 8601)"),
  tmplDesc: z
    .string()
    .optional()
    .describe("Human-readable description of the template"),
  cmd: z
    .string()
    .optional()
    .describe("Call management data command string"),
  timezone: z
    .string()
    .optional()
    .describe("Timezone identifier, e.g. 'America/New_York'"),
  dayLightSavings: z
    .string()
    .optional()
    .describe("Daylight savings setting ('Y' or 'N')"),
  priInterLT: z
    .string()
    .optional()
    .describe("Primary inter-LATA carrier code"),
  priIntraLT: z
    .string()
    .optional()
    .describe("Primary intra-LATA carrier code"),
  interLATACarrier: z
    .array(z.string())
    .optional()
    .describe("List of inter-LATA carrier codes"),
  intraLATACarrier: z
    .array(z.string())
    .optional()
    .describe("List of intra-LATA carrier codes"),
  numTermLine: z
    .number()
    .optional()
    .describe("Number of terminating lines"),
  conName: z
    .string()
    .optional()
    .describe("Contact name for this template"),
  conTel: z
    .string()
    .optional()
    .describe("Contact telephone number for this template"),
  notes: z
    .string()
    .optional()
    .describe("Free-text notes to attach to the template"),
  aos: z
    .object({})
    .passthrough()
    .optional()
    .describe("Area-of-service definition object"),
  cprSectName: z
    .array(z.string())
    .optional()
    .describe("List of CPR section names referenced by this template"),
  lbl: z
    .array(z.string())
    .optional()
    .describe("Label list associated with the template"),
};

export function registerTollfreeTools(
  server: McpServer,
  client: TniqClient
): void {
  // -------------------------------------------------------------------------
  // TEMPLATES
  // -------------------------------------------------------------------------

  // 1. tf_list_templates
  server.tool(
    "tf_list_templates",
    "Use when you need to retrieve all toll-free routing templates available in the account.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const data = await client.get("/api/v1/tollfree/templates");
      return formatResponse(data);
    }
  );

  // 2. tf_get_template
  server.tool(
    "tf_get_template",
    "Use when you need the full details of a single toll-free routing template by name.",
    {
      tmplName: z
        .string()
        .describe("Name of the template to retrieve"),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ tmplName }) => {
      if (!tmplName) return errorResult("tmplName is required");
      const data = await client.get(
        `/api/v1/tollfree/templates/${encodeURIComponent(tmplName)}`
      );
      return formatResponse(data);
    }
  );

  // 3. tf_create_template
  server.tool(
    "tf_create_template",
    "Use when you need to create a new toll-free routing template in the system.",
    {
      tmplName: z
        .string()
        .describe("Unique name for the new template"),
      ...templateBodyFields,
    },
    async ({ tmplName, ...rest }) => {
      const data = await client.post("/api/v1/tollfree/templates", {
        tmplName,
        ...rest,
      });
      return formatResponse(data);
    }
  );

  // 4. tf_update_template
  server.tool(
    "tf_update_template",
    "Use when you need to update an existing toll-free routing template. Requires the current record version ID to prevent conflicts.",
    {
      tmplName: z
        .string()
        .describe("Name of the template to update"),
      recVersionId: z
        .string()
        .describe("Current record version ID for optimistic concurrency control"),
      tmplRecCompPart: z
        .string()
        .optional()
        .describe("Template record completion part indicator"),
      ...templateBodyFields,
    },
    async ({ tmplName, recVersionId, tmplRecCompPart, ...rest }) => {
      const data = await client.put("/api/v1/tollfree/templates", {
        tmplName,
        recVersionId,
        ...(tmplRecCompPart !== undefined ? { tmplRecCompPart } : {}),
        ...rest,
      });
      return formatResponse(data);
    }
  );

  // 5. tf_delete_template
  server.tool(
    "tf_delete_template",
    "Use when you need to permanently delete a toll-free routing template from the system.",
    {
      tmplName: z
        .string()
        .describe("Name of the template to delete"),
    },
    async ({ tmplName }) => {
      const data = await client.delete(
        `/api/v1/tollfree/templates/${encodeURIComponent(tmplName)}`
      );
      return formatResponse(data);
    }
  );

  // 6. tf_lock_template
  server.tool(
    "tf_lock_template",
    "Use when you need to lock a toll-free routing template to prevent concurrent modifications.",
    {
      tmplName: z
        .string()
        .describe("Name of the template to lock"),
    },
    async ({ tmplName }) => {
      const data = await client.put(
        `/api/v1/tollfree/templates/${encodeURIComponent(tmplName)}/lock`
      );
      return formatResponse(data);
    }
  );

  // 7. tf_unlock_template
  server.tool(
    "tf_unlock_template",
    "Use when you need to unlock a previously locked toll-free routing template.",
    {
      tmplName: z
        .string()
        .describe("Name of the template to unlock"),
    },
    async ({ tmplName }) => {
      const data = await client.put(
        `/api/v1/tollfree/templates/${encodeURIComponent(tmplName)}/unlock`
      );
      return formatResponse(data);
    }
  );

  // 8. tf_copy_template
  server.tool(
    "tf_copy_template",
    "Use when you need to copy an existing toll-free routing template to a new name or effective date.",
    {
      srcTmplName: z
        .string()
        .describe("Name of the source template to copy from"),
      srcEffDtTm: z
        .string()
        .describe("Effective date/time of the source template version to copy"),
      tgtTmplName: z
        .string()
        .describe("Name for the new destination template"),
      tgtEffDtTm: z
        .string()
        .describe("Effective date/time for the new destination template version"),
    },
    async ({ srcTmplName, srcEffDtTm, tgtTmplName, tgtEffDtTm }) => {
      const data = await client.post("/api/v1/tollfree/templates/copy", {
        srcTmplName,
        srcEffDtTm,
        tgtTmplName,
        tgtEffDtTm,
      });
      return formatResponse(data);
    }
  );

  // 9. tf_disconnect_template
  server.tool(
    "tf_disconnect_template",
    "Use when you need to disconnect a toll-free routing template, removing its active routing associations.",
    {
      tmplName: z
        .string()
        .describe("Name of the template to disconnect"),
    },
    async ({ tmplName }) => {
      const data = await client.post(
        `/api/v1/tollfree/templates/${encodeURIComponent(tmplName)}/disconnect`
      );
      return formatResponse(data);
    }
  );

  // 10. tf_get_template_history
  server.tool(
    "tf_get_template_history",
    "Use when you need to view the change history of a toll-free routing template.",
    {
      tmplName: z
        .string()
        .describe("Name of the template whose history to retrieve"),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ tmplName }) => {
      const data = await client.get(
        `/api/v1/tollfree/templates/${encodeURIComponent(tmplName)}/history`
      );
      return formatResponse(data);
    }
  );

  // 11. tf_get_template_history_version
  server.tool(
    "tf_get_template_history_version",
    "Use when you need the details of a specific historical version of a toll-free routing template identified by effective date/time and activity timestamp.",
    {
      tmplName: z
        .string()
        .describe("Name of the template"),
      effDtTm: z
        .string()
        .describe("Effective date/time of the historical version to retrieve"),
      activityTimestamp: z
        .string()
        .describe("Activity timestamp that uniquely identifies this history entry"),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ tmplName, effDtTm, activityTimestamp }) => {
      const data = await client.get(
        `/api/v1/tollfree/templates/${encodeURIComponent(tmplName)}/history/${encodeURIComponent(effDtTm)}/${encodeURIComponent(activityTimestamp)}`
      );
      return formatResponse(data);
    }
  );

  // -------------------------------------------------------------------------
  // DRAFTS
  // -------------------------------------------------------------------------

  // 12. tf_list_drafts
  server.tool(
    "tf_list_drafts",
    "Use when you need to list all saved toll-free template drafts that have not yet been pushed to Somos.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const data = await client.get("/api/v1/tollfree/templates/drafts");
      return formatResponse(data);
    }
  );

  // 13. tf_get_draft
  server.tool(
    "tf_get_draft",
    "Use when you need to retrieve the full contents of a specific toll-free template draft by its draft ID.",
    {
      draftId: z
        .string()
        .describe("Unique identifier of the draft to retrieve"),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ draftId }) => {
      const data = await client.get(
        `/api/v1/tollfree/templates/drafts/${encodeURIComponent(draftId)}`
      );
      return formatResponse(data);
    }
  );

  // 14. tf_save_draft
  server.tool(
    "tf_save_draft",
    "Use when you need to save a toll-free template as a draft for later review before pushing to Somos.",
    {
      body: z
        .record(z.string(), z.unknown())
        .describe("Request body containing the draft template data"),
    },
    async ({ body }) => {
      const data = await client.post(
        "/api/v1/tollfree/templates/drafts",
        body
      );
      return formatResponse(data);
    }
  );

  // 15. tf_delete_draft
  server.tool(
    "tf_delete_draft",
    "Use when you need to permanently delete a toll-free template draft without pushing it to Somos.",
    {
      draftId: z
        .string()
        .describe("Unique identifier of the draft to delete"),
    },
    async ({ draftId }) => {
      const data = await client.delete(
        `/api/v1/tollfree/templates/drafts/${encodeURIComponent(draftId)}`
      );
      return formatResponse(data);
    }
  );

  // 16. tf_push_draft
  server.tool(
    "tf_push_draft",
    "Use when you need to promote a saved toll-free template draft and submit it to Somos for activation.",
    {
      draftId: z
        .string()
        .describe("Unique identifier of the draft to push to Somos"),
    },
    async ({ draftId }) => {
      const data = await client.post(
        `/api/v1/tollfree/templates/drafts/${encodeURIComponent(draftId)}/push`
      );
      return formatResponse(data);
    }
  );

  // -------------------------------------------------------------------------
  // TFN OPERATIONS
  // -------------------------------------------------------------------------

  // 17. tf_query_status
  server.tool(
    "tf_query_status",
    "Use when you need to query the current status of one or more toll-free numbers in Somos.",
    {
      body: z
        .record(z.string(), z.unknown())
        .describe("Request body containing the numbers array and any query options"),
    },
    async ({ body }) => {
      const data = await client.put("/api/v1/tollfree/query", body);
      return formatResponse(data);
    }
  );

  // 18. tf_search_spare
  server.tool(
    "tf_search_spare",
    "Use when you need to find available spare toll-free numbers matching a given pattern without reserving them.",
    {
      pattern: z
        .string()
        .describe("Number pattern to search for, e.g. '8**-555-****'"),
      quantity: z
        .number()
        .optional()
        .describe("Maximum number of spare numbers to return"),
    },
    async ({ pattern, quantity }) => {
      const data = await client.post("/api/v1/tollfree/search-spare", {
        pattern,
        ...(quantity !== undefined ? { quantity } : {}),
      });
      return formatResponse(data);
    }
  );

  // 19. tf_search_and_reserve
  server.tool(
    "tf_search_and_reserve",
    "Use when you need to search for available toll-free numbers matching a pattern and immediately reserve them.",
    {
      pattern: z
        .string()
        .describe("Number pattern to search and reserve, e.g. '800-555-****'"),
      quantity: z
        .number()
        .optional()
        .describe("Number of toll-free numbers to reserve"),
    },
    async ({ pattern, quantity }) => {
      const data = await client.post("/api/v1/tollfree/search-and-reserve", {
        pattern,
        ...(quantity !== undefined ? { quantity } : {}),
      });
      return formatResponse(data);
    }
  );

  // 20. tf_reserve
  server.tool(
    "tf_reserve",
    "Use when you need to reserve one or more specific toll-free numbers by their exact digits.",
    {
      numbers: z
        .array(z.string())
        .describe("List of toll-free numbers to reserve, e.g. ['8005551234']"),
    },
    async ({ numbers }) => {
      const data = await client.post("/api/v1/tollfree/reserve", { numbers });
      return formatResponse(data);
    }
  );

  // 21. tf_release_reservation
  server.tool(
    "tf_release_reservation",
    "Use when you need to release a reserved toll-free number back to the spare pool.",
    {
      tfn: z
        .string()
        .describe("The toll-free number whose reservation should be released, e.g. '8005551234'"),
    },
    async ({ tfn }) => {
      const data = await client.delete(
        `/api/v1/tollfree/reserve/${encodeURIComponent(tfn)}`
      );
      return formatResponse(data);
    }
  );

  // 22. tf_activate
  server.tool(
    "tf_activate",
    "Use when you need to activate toll-free numbers by assigning them to a routing template with a service order.",
    {
      numbers: z
        .array(z.string())
        .describe("List of toll-free numbers to activate, e.g. ['8005551234']"),
      tmplName: z
        .string()
        .describe("Name of the routing template to assign to these numbers"),
      effDtTm: z
        .string()
        .describe("Effective date/time for the activation (ISO 8601)"),
      svcOrderNum: z
        .string()
        .describe("Service order number associated with this activation"),
    },
    async ({ numbers, tmplName, effDtTm, svcOrderNum }) => {
      const data = await client.post("/api/v1/tollfree/activate", {
        numbers,
        tmplName,
        effDtTm,
        svcOrderNum,
      });
      return formatResponse(data);
    }
  );

  // 23. tf_disconnect
  server.tool(
    "tf_disconnect",
    "Use when you need to disconnect an active toll-free number, removing its routing and returning it to spare.",
    {
      num: z
        .string()
        .describe("The toll-free number to disconnect, e.g. '8005551234'"),
    },
    async ({ num }) => {
      const data = await client.post(
        `/api/v1/tollfree/disconnect/${encodeURIComponent(num)}`
      );
      return formatResponse(data);
    }
  );

  // 24. tf_change_resporg
  server.tool(
    "tf_change_resporg",
    "Use when you need to transfer responsibility of a toll-free number to a different Responsible Organization (RespOrg).",
    {
      body: z
        .record(z.string(), z.unknown())
        .describe("Request body containing the RespOrg change details"),
    },
    async ({ body }) => {
      const data = await client.post("/api/v1/tollfree/change-resporg", body);
      return formatResponse(data);
    }
  );

  // -------------------------------------------------------------------------
  // READ-ONLY INFO
  // -------------------------------------------------------------------------

  // 25. tf_get_status
  server.tool(
    "tf_get_status",
    "Use when you need to check whether the Somos toll-free registry is currently available and reachable.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const data = await client.get("/api/v1/tollfree/status");
      return formatResponse(data);
    }
  );

  // 26. tf_get_inventory
  server.tool(
    "tf_get_inventory",
    "Use when you need to retrieve the full list of toll-free numbers in the account's inventory.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const data = await client.get("/api/v1/tollfree/inventory");
      return formatResponse(data);
    }
  );

  // 27. tf_get_inventory_summary
  server.tool(
    "tf_get_inventory_summary",
    "Use when you need a high-level summary of the account's toll-free inventory counts by status.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const data = await client.get("/api/v1/tollfree/inventory/summary");
      return formatResponse(data);
    }
  );

  // 28. tf_get_reserved_numbers
  server.tool(
    "tf_get_reserved_numbers",
    "Use when you need to list all toll-free numbers that are currently in a reserved state.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const data = await client.get("/api/v1/tollfree/reserved-numbers");
      return formatResponse(data);
    }
  );

  // 29. tf_get_pointer_record
  server.tool(
    "tf_get_pointer_record",
    "Use when you need to look up the pointer record for a specific toll-free number to see where it points.",
    {
      num: z
        .string()
        .describe("The toll-free number to query the pointer record for, e.g. '8005551234'"),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ num }) => {
      const data = await client.get(
        `/api/v1/tollfree/pointer-record/${encodeURIComponent(num)}`
      );
      return formatResponse(data);
    }
  );

  // 30. tf_get_history
  server.tool(
    "tf_get_history",
    "Use when you need to view the activity history of a specific toll-free number.",
    {
      tfn: z
        .string()
        .describe("The toll-free number whose history to retrieve, e.g. '8005551234'"),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ tfn }) => {
      const data = await client.get(
        `/api/v1/tollfree/history/${encodeURIComponent(tfn)}`
      );
      return formatResponse(data);
    }
  );

  // 31. tf_get_resporgs
  server.tool(
    "tf_get_resporgs",
    "Use when you need to list all Responsible Organizations (RespOrgs) associated with a given entity.",
    {
      entityId: z
        .string()
        .describe("The entity ID whose RespOrgs to retrieve"),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ entityId }) => {
      const data = await client.get(
        `/api/v1/tollfree/entities/${encodeURIComponent(entityId)}/respOrgs`
      );
      return formatResponse(data);
    }
  );

  // 32. tf_get_active_resporgs
  server.tool(
    "tf_get_active_resporgs",
    "Use when you need to list only the currently active Responsible Organizations (RespOrgs) for a given entity.",
    {
      entityId: z
        .string()
        .describe("The entity ID whose active RespOrgs to retrieve"),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ entityId }) => {
      const data = await client.get(
        `/api/v1/tollfree/entities/${encodeURIComponent(entityId)}/respOrgs/active`
      );
      return formatResponse(data);
    }
  );

  // 33. tf_get_customer_config
  server.tool(
    "tf_get_customer_config",
    "Use when you need to retrieve the toll-free configuration settings for the current customer account.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const data = await client.get("/api/v1/tollfree/customer-config");
      return formatResponse(data);
    }
  );

  // -------------------------------------------------------------------------
  // SYNC
  // -------------------------------------------------------------------------

  // 34. tf_start_sync
  server.tool(
    "tf_start_sync",
    "Use when you need to start a synchronization job to pull the latest toll-free inventory data from Somos.",
    {
      customerId: z
        .string()
        .optional()
        .describe("Customer ID to scope the sync to a specific customer"),
      respOrgIds: z
        .array(z.string())
        .optional()
        .describe("List of RespOrg IDs to include in the sync"),
      includeCpr: z
        .boolean()
        .optional()
        .describe("Whether to include Call Processing Records (CPR) in the sync"),
      triggeredBy: z
        .string()
        .optional()
        .describe("Identifier of the user or system that triggered the sync"),
    },
    async ({ customerId, respOrgIds, includeCpr, triggeredBy }) => {
      const body: Record<string, unknown> = {};
      if (customerId !== undefined) body.customerId = customerId;
      if (respOrgIds !== undefined) body.respOrgIds = respOrgIds;
      if (includeCpr !== undefined) body.includeCpr = includeCpr;
      if (triggeredBy !== undefined) body.triggeredBy = triggeredBy;
      const data = await client.post("/api/v1/tollfree/sync/start", body);
      return formatResponse(data);
    }
  );

  // 35. tf_get_sync_status
  server.tool(
    "tf_get_sync_status",
    "Use when you need to check the current status or progress of a running or completed sync job.",
    {
      syncJobId: z
        .string()
        .describe("Unique identifier of the sync job to check"),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ syncJobId }) => {
      const data = await client.get(
        `/api/v1/tollfree/sync/${encodeURIComponent(syncJobId)}`
      );
      return formatResponse(data);
    }
  );

  // 36. tf_cancel_sync
  server.tool(
    "tf_cancel_sync",
    "Use when you need to cancel a toll-free inventory sync job that is currently in progress.",
    {
      syncJobId: z
        .string()
        .describe("Unique identifier of the sync job to cancel"),
    },
    async ({ syncJobId }) => {
      const data = await client.delete(
        `/api/v1/tollfree/sync/${encodeURIComponent(syncJobId)}`
      );
      return formatResponse(data);
    }
  );

  // 37. tf_get_sync_history
  server.tool(
    "tf_get_sync_history",
    "Use when you need to review the history of past toll-free inventory sync jobs.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const data = await client.get("/api/v1/tollfree/sync/history");
      return formatResponse(data);
    }
  );
}
