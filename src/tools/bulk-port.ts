import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse, errorResult } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";

export function registerBulkPortTools(server: McpServer, client: TniqClient): void {
  // ─── Projects ────────────────────────────────────────────────────────────────

  // 1. port_list_projects — GET /api/v1/port-projects/projects
  server.tool(
    "port_list_projects",
    "Use this tool when you need to list all bulk port projects, optionally filtered by service provider or customer.",
    {
      spid: z
        .string()
        .describe("Optional 4-character Service Provider ID to filter projects by.")
        .optional(),
      customerId: z
        .string()
        .describe("Optional customer ID to filter projects by.")
        .optional(),
      page: z
        .number()
        .int()
        .describe("Optional zero-based page number for pagination.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of results per page.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ spid, customerId, page, size }) => {
      const result = await client.get("/api/v1/port-projects/projects", {
        spid,
        customerId,
        page,
        size,
      });
      return formatResponse(result);
    }
  );

  // 2. port_get_project — GET /api/v1/port-projects/projects/{projectId}
  server.tool(
    "port_get_project",
    "Use this tool when you need to retrieve the full details of a specific bulk port project by its ID.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to retrieve."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const result = await client.get(`/api/v1/port-projects/projects/${projectId}`);
      return formatResponse(result);
    }
  );

  // 3. port_create_project — POST /api/v1/port-projects/projects
  server.tool(
    "port_create_project",
    "Use this tool when you need to create a new bulk port project for porting telephone numbers to a service provider.",
    {
      customer_id: z
        .string()
        .describe("The customer ID that owns this port project."),
      spid: z
        .string()
        .describe("The 4-character Service Provider ID (gaining SPID) for this port project."),
      name: z
        .string()
        .describe("A human-readable name for the port project."),
      desired_due_date: z
        .string()
        .describe("Optional desired due date for the port in ISO 8601 format (e.g., 2025-06-15T10:00:00Z).")
        .optional(),
      auto_activation_mode: z
        .string()
        .describe("Optional auto-activation mode for the project (e.g., DISABLED, ASAP, SCHEDULED).")
        .optional(),
      scheduled_activation_at: z
        .string()
        .describe("Optional scheduled activation timestamp in ISO 8601 format, required when auto_activation_mode is SCHEDULED.")
        .optional(),
    },
    async ({ customer_id, spid, name, desired_due_date, auto_activation_mode, scheduled_activation_at }) => {
      const body: Record<string, string> = { customer_id, spid, name };
      if (desired_due_date !== undefined) body.desired_due_date = desired_due_date;
      if (auto_activation_mode !== undefined) body.auto_activation_mode = auto_activation_mode;
      if (scheduled_activation_at !== undefined) body.scheduled_activation_at = scheduled_activation_at;
      const result = await client.post("/api/v1/port-projects/projects", body);
      return formatResponse(result);
    }
  );

  // 4. port_update_project — PUT /api/v1/port-projects/projects/{projectId}
  server.tool(
    "port_update_project",
    "Use this tool when you need to update the metadata, status, LRN, notes, or validation errors of an existing bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to update."),
      name: z
        .string()
        .describe("Optional new name for the project.")
        .optional(),
      status: z
        .string()
        .describe("Optional new status value for the project.")
        .optional(),
      gaining_lrn: z
        .string()
        .describe("Optional gaining Location Routing Number (LRN) to set on the project.")
        .optional(),
      notes: z
        .record(z.unknown())
        .describe("Optional notes object to attach to the project.")
        .optional(),
      validation_errors: z
        .record(z.unknown())
        .describe("Optional validation errors object to set on the project.")
        .optional(),
    },
    async ({ projectId, name, status, gaining_lrn, notes, validation_errors }) => {
      const body: Record<string, unknown> = {};
      if (name !== undefined) body.name = name;
      if (status !== undefined) body.status = status;
      if (gaining_lrn !== undefined) body.gaining_lrn = gaining_lrn;
      if (notes !== undefined) body.notes = notes;
      if (validation_errors !== undefined) body.validation_errors = validation_errors;
      const result = await client.put(`/api/v1/port-projects/projects/${projectId}`, body);
      return formatResponse(result);
    }
  );

  // 5. port_delete_project — DELETE /api/v1/port-projects/projects/{projectId}
  server.tool(
    "port_delete_project",
    "Use this tool when you need to permanently delete a bulk port project and all its associated data.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to delete."),
    },
    async ({ projectId }) => {
      const result = await client.delete(`/api/v1/port-projects/projects/${projectId}`);
      return formatResponse(result);
    }
  );

  // 6. port_get_details — GET /api/v1/port-projects/projects/{projectId}/details
  server.tool(
    "port_get_details",
    "Use this tool when you need to list the telephone numbers (TNs) within a bulk port project with their validation status and lifecycle states.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to retrieve TN details for."),
      search: z
        .string()
        .describe("Optional search term to filter TNs by number or other attributes.")
        .optional(),
      validationStatus: z
        .enum(["PENDING", "VALIDATING", "VALID", "ERROR"])
        .describe("Optional validation status filter. One of: PENDING, VALIDATING, VALID, ERROR.")
        .optional(),
      lifecycleStates: z
        .string()
        .describe("Optional comma-separated list of lifecycle states to filter by (e.g., 'PENDING,ACTIVE').")
        .optional(),
      page: z
        .number()
        .int()
        .describe("Optional zero-based page number for pagination.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of results per page.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId, search, validationStatus, lifecycleStates, page, size }) => {
      const result = await client.get(`/api/v1/port-projects/projects/${projectId}/details`, {
        search,
        validationStatus,
        lifecycleStates,
        page,
        size,
      });
      return formatResponse(result);
    }
  );

  // 7. port_update_tn_detail — PUT /api/v1/port-projects/projects/{projectId}/details/{tn}
  server.tool(
    "port_update_tn_detail",
    "Use this tool when you need to update the metadata, status, LRN, notes, or validation errors for a specific telephone number within a bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project containing the TN."),
      tn: z
        .string()
        .describe("The 10-digit telephone number to update within the project."),
      name: z
        .string()
        .describe("Optional new name or label for this TN detail record.")
        .optional(),
      status: z
        .string()
        .describe("Optional new status value for this TN.")
        .optional(),
      gaining_lrn: z
        .string()
        .describe("Optional gaining Location Routing Number (LRN) to assign to this TN.")
        .optional(),
      notes: z
        .record(z.unknown())
        .describe("Optional notes object to attach to this TN detail.")
        .optional(),
      validation_errors: z
        .record(z.unknown())
        .describe("Optional validation errors object to set on this TN detail.")
        .optional(),
    },
    async ({ projectId, tn, name, status, gaining_lrn, notes, validation_errors }) => {
      const body: Record<string, unknown> = {};
      if (name !== undefined) body.name = name;
      if (status !== undefined) body.status = status;
      if (gaining_lrn !== undefined) body.gaining_lrn = gaining_lrn;
      if (notes !== undefined) body.notes = notes;
      if (validation_errors !== undefined) body.validation_errors = validation_errors;
      const result = await client.put(
        `/api/v1/port-projects/projects/${projectId}/details/${tn}`,
        body
      );
      return formatResponse(result);
    }
  );

  // 8. port_get_statistics — GET /api/v1/port-projects/projects/{projectId}/statistics
  server.tool(
    "port_get_statistics",
    "Use this tool when you need a fast aggregated summary of TN counts by validation status and lifecycle state for a bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to retrieve statistics for."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const result = await client.get(`/api/v1/port-projects/projects/${projectId}/statistics`);
      return formatResponse(result);
    }
  );

  // 9. port_get_progress — GET /api/v1/port-projects/projects/{projectId}/progress
  server.tool(
    "port_get_progress",
    "Use this tool when you need to poll the current validation progress of a bulk port project, such as how many TNs have been validated so far.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to check validation progress for."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const result = await client.get(`/api/v1/port-projects/projects/${projectId}/progress`);
      return formatResponse(result);
    }
  );

  // 10. port_get_detailed_progress — POST /api/v1/port-projects/projects/{projectId}/progress/detailed
  server.tool(
    "port_get_detailed_progress",
    "Use this tool when you need detailed progress information for a bulk port project, including recent events and aggregated statistics.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to retrieve detailed progress for."),
      include_events: z
        .boolean()
        .describe("Optional flag to include recent events in the response.")
        .optional(),
      event_limit: z
        .number()
        .int()
        .describe("Optional maximum number of events to include when include_events is true.")
        .optional(),
      include_statistics: z
        .boolean()
        .describe("Optional flag to include aggregated statistics in the response.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId, include_events, event_limit, include_statistics }) => {
      const body: Record<string, unknown> = { project_id: projectId };
      if (include_events !== undefined) body.include_events = include_events;
      if (event_limit !== undefined) body.event_limit = event_limit;
      if (include_statistics !== undefined) body.include_statistics = include_statistics;
      const result = await client.post(
        `/api/v1/port-projects/projects/${projectId}/progress/detailed`,
        body
      );
      return formatResponse(result);
    }
  );

  // 11. port_get_lifecycle_summary — GET /api/v1/port-projects/projects/{projectId}/lifecycle-summary
  server.tool(
    "port_get_lifecycle_summary",
    "Use this tool when you need a summary of port lifecycle states across all TNs in a bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to retrieve the lifecycle summary for."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const result = await client.get(
        `/api/v1/port-projects/projects/${projectId}/lifecycle-summary`
      );
      return formatResponse(result);
    }
  );

  // 12. port_get_error_groups — GET /api/v1/port-projects/projects/{projectId}/error-groups
  server.tool(
    "port_get_error_groups",
    "Use this tool when you need to retrieve grouped validation errors for a bulk port project so you can address related issues in batch.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to retrieve error groups for."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const result = await client.get(
        `/api/v1/port-projects/projects/${projectId}/error-groups`
      );
      return formatResponse(result);
    }
  );

  // ─── Actions ─────────────────────────────────────────────────────────────────

  // 13. port_validate — POST /api/v1/port-projects/projects/{projectId}/validate
  server.tool(
    "port_validate",
    "Use this tool when you need to trigger validation of all TNs in a bulk port project against SOA and NPAC rules.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to validate."),
      customerId: z
        .string()
        .describe("Optional customer ID to associate with the validation request.")
        .optional(),
    },
    async ({ projectId, customerId }) => {
      const result = await client.post(
        `/api/v1/port-projects/projects/${projectId}/validate${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ""}`
      );
      return formatResponse(result);
    }
  );

  // 14. port_submit — POST /api/v1/port-projects/projects/{projectId}/submit
  server.tool(
    "port_submit",
    "Use this tool when you need to submit all validated TNs in a bulk port project to SOA for processing.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to submit."),
      dueDate: z
        .string()
        .describe("Optional due date override for the submission in ISO 8601 format (e.g., 2025-06-15T10:00:00Z).")
        .optional(),
    },
    async ({ projectId, dueDate }) => {
      const result = await client.post(
        `/api/v1/port-projects/projects/${projectId}/submit${dueDate ? `?dueDate=${encodeURIComponent(dueDate)}` : ""}`
      );
      return formatResponse(result);
    }
  );

  // 15. port_cancel — POST /api/v1/port-projects/projects/{projectId}/cancel
  server.tool(
    "port_cancel",
    "Use this tool when you need to cancel an entire bulk port project, stopping all pending port operations for its TNs.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to cancel."),
    },
    async ({ projectId }) => {
      const result = await client.post(`/api/v1/port-projects/projects/${projectId}/cancel`);
      return formatResponse(result);
    }
  );

  // 16. port_sync — POST /api/v1/port-projects/projects/{projectId}/sync
  server.tool(
    "port_sync",
    "Use this tool when you need to synchronize a bulk port project's TN states with the current NPAC data.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to sync with NPAC."),
    },
    async ({ projectId }) => {
      const result = await client.post(`/api/v1/port-projects/projects/${projectId}/sync`);
      return formatResponse(result);
    }
  );

  // 17. port_set_priority — POST /api/v1/port-projects/projects/{projectId}/priority
  server.tool(
    "port_set_priority",
    "Use this tool when you need to set the processing priority level for a bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to set priority on."),
      priority: z
        .string()
        .describe("The priority level to assign to the project (e.g., HIGH, NORMAL, LOW)."),
    },
    async ({ projectId, priority }) => {
      const result = await client.post(
        `/api/v1/port-projects/projects/${projectId}/priority?priority=${encodeURIComponent(priority)}`
      );
      return formatResponse(result);
    }
  );

  // 18. port_auto_fix — POST /api/v1/port-projects/projects/{projectId}/auto-fix
  server.tool(
    "port_auto_fix",
    "Use this tool when you need to automatically resolve fixable validation errors in a bulk port project, optionally scoped to a specific error group or list of TNs.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to auto-fix errors in."),
      errorGroupId: z
        .string()
        .describe("Optional error group ID to scope auto-fix to a specific category of errors.")
        .optional(),
      tns: z
        .array(z.string().describe("A 10-digit telephone number to auto-fix."))
        .describe("Optional list of specific telephone numbers to auto-fix. If omitted, all fixable TNs are processed.")
        .optional(),
    },
    async ({ projectId, errorGroupId, tns }) => {
      const url = `/api/v1/port-projects/projects/${projectId}/auto-fix${errorGroupId ? `?errorGroupId=${encodeURIComponent(errorGroupId)}` : ""}`;
      const result = await client.post(url, tns);
      return formatResponse(result);
    }
  );

  // 19. port_fix_ddd_mismatch — POST /api/v1/port-projects/projects/{projectId}/details/{tn}/fix-ddd-mismatch
  server.tool(
    "port_fix_ddd_mismatch",
    "Use this tool when you need to correct a Due Date Discrepancy (DDD) mismatch for a specific telephone number in a bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project containing the TN with the DDD mismatch."),
      tn: z
        .string()
        .describe("The 10-digit telephone number that has the DDD mismatch to fix."),
      correctedDdd: z
        .string()
        .describe("The corrected due date value in ISO 8601 format (e.g., 2025-06-15T10:00:00Z)."),
    },
    async ({ projectId, tn, correctedDdd }) => {
      const result = await client.post(
        `/api/v1/port-projects/projects/${projectId}/details/${tn}/fix-ddd-mismatch?correctedDdd=${encodeURIComponent(correctedDdd)}`
      );
      return formatResponse(result);
    }
  );

  // 20. port_bulk_actions — POST /api/v1/port-projects/projects/{projectId}/actions
  server.tool(
    "port_bulk_actions",
    "Use this tool when you need to perform a batch action (activate, cancel, submit, resubmit, revalidate, delete, or update DDD) on multiple telephone numbers within a bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to perform bulk actions on."),
      tns: z
        .array(z.string().describe("A 10-digit telephone number to include in the bulk action."))
        .describe("The list of telephone numbers to apply the action to."),
      action: z
        .enum(["ACTIVATE", "CANCEL", "SUP_DDD", "DELETE", "REVALIDATE", "SUBMIT", "RESUBMIT"])
        .describe("Optional action to perform on the TNs. One of: ACTIVATE, CANCEL, SUP_DDD, DELETE, REVALIDATE, SUBMIT, RESUBMIT.")
        .optional(),
      new_ddd: z
        .string()
        .describe("Optional new due date in ISO 8601 format, required when action is SUP_DDD.")
        .optional(),
    },
    async ({ projectId, tns, action, new_ddd }) => {
      const body: Record<string, unknown> = { tns };
      if (action !== undefined) body.action = action;
      if (new_ddd !== undefined) body.new_ddd = new_ddd;
      const result = await client.post(`/api/v1/port-projects/projects/${projectId}/actions`, body);
      return formatResponse(result);
    }
  );

  // 21. port_get_batch_operations — GET /api/v1/port-projects/projects/{projectId}/batch-operations
  server.tool(
    "port_get_batch_operations",
    "Use this tool when you need to review the history of batch operations that have been performed on a bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to retrieve batch operation history for."),
      status: z
        .string()
        .describe("Optional status filter to narrow results to batch operations in a specific state (e.g., COMPLETED, FAILED, PENDING).")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId, status }) => {
      const result = await client.get(
        `/api/v1/port-projects/projects/${projectId}/batch-operations`,
        { status }
      );
      return formatResponse(result);
    }
  );

  // ─── Auto-activation ─────────────────────────────────────────────────────────

  // 22. port_get_auto_activation — GET /api/v1/port-projects/projects/{projectId}/auto-activation
  server.tool(
    "port_get_auto_activation",
    "Use this tool when you need to retrieve the current auto-activation settings for a bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to retrieve auto-activation settings for."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const result = await client.get(
        `/api/v1/port-projects/projects/${projectId}/auto-activation`
      );
      return formatResponse(result);
    }
  );

  // 23. port_update_auto_activation — PUT /api/v1/port-projects/projects/{projectId}/auto-activation
  server.tool(
    "port_update_auto_activation",
    "Use this tool when you need to enable, disable, or reschedule the auto-activation behavior for a bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to update auto-activation settings for."),
      auto_activation_mode: z
        .enum(["DISABLED", "ASAP", "SCHEDULED"])
        .describe("The auto-activation mode to set. One of: DISABLED (no auto-activation), ASAP (activate as soon as possible), SCHEDULED (activate at a specific time)."),
      scheduled_activation_at: z
        .string()
        .describe("Optional scheduled activation timestamp in ISO 8601 format. Required when auto_activation_mode is SCHEDULED.")
        .optional(),
      reset_failure_count: z
        .boolean()
        .describe("Optional flag to reset the failure count for auto-activation attempts.")
        .optional(),
    },
    async ({ projectId, auto_activation_mode, scheduled_activation_at, reset_failure_count }) => {
      const body: Record<string, unknown> = { auto_activation_mode };
      if (scheduled_activation_at !== undefined) body.scheduled_activation_at = scheduled_activation_at;
      if (reset_failure_count !== undefined) body.reset_failure_count = reset_failure_count;
      const result = await client.put(
        `/api/v1/port-projects/projects/${projectId}/auto-activation`,
        body
      );
      return formatResponse(result);
    }
  );

  // ─── Workflow Rules ───────────────────────────────────────────────────────────

  // 24. port_get_workflow_rules — GET /api/v1/port-projects/workflow-rules
  server.tool(
    "port_get_workflow_rules",
    "Use this tool when you need to retrieve the workflow rules that govern automated port project behavior, optionally filtered by customer or active status.",
    {
      customerId: z
        .string()
        .describe("Optional customer ID to filter workflow rules by.")
        .optional(),
      activeOnly: z
        .boolean()
        .describe("Optional flag to return only currently active workflow rules.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ customerId, activeOnly }) => {
      const result = await client.get("/api/v1/port-projects/workflow-rules", {
        customerId,
        activeOnly,
      });
      return formatResponse(result);
    }
  );

  // 25. port_create_workflow_rule — POST /api/v1/port-projects/workflow-rules
  server.tool(
    "port_create_workflow_rule",
    "Use this tool when you need to create a new workflow rule that controls automated behavior for bulk port projects.",
    {
      rule: z
        .record(z.unknown())
        .describe("The workflow rule definition object. The exact schema depends on the rule type — consult the TNIQ API documentation for the required fields."),
    },
    async ({ rule }) => {
      const result = await client.post("/api/v1/port-projects/workflow-rules", rule);
      return formatResponse(result);
    }
  );

  // ─── Filter Presets ───────────────────────────────────────────────────────────

  // 26. port_get_filter_presets — GET /api/v1/port-projects/filter-presets
  server.tool(
    "port_get_filter_presets",
    "Use this tool when you need to retrieve the saved filter presets available for searching and viewing bulk port project TNs.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const result = await client.get("/api/v1/port-projects/filter-presets");
      return formatResponse(result);
    }
  );

  // 27. port_save_filter_preset — POST /api/v1/port-projects/filter-presets
  server.tool(
    "port_save_filter_preset",
    "Use this tool when you need to save a new filter preset for reuse when browsing bulk port project TNs.",
    {
      preset: z
        .record(z.unknown())
        .describe("The filter preset definition object containing the name and filter criteria to save."),
    },
    async ({ preset }) => {
      const result = await client.post("/api/v1/port-projects/filter-presets", preset);
      return formatResponse(result);
    }
  );

  // ─── Jobs ─────────────────────────────────────────────────────────────────────

  // 28. port_get_job_stats — GET /api/v1/port-projects/jobs/stats
  server.tool(
    "port_get_job_stats",
    "Use this tool when you need an overview of all bulk port job counts by state (e.g., pending, running, completed, failed).",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const result = await client.get("/api/v1/port-projects/jobs/stats");
      return formatResponse(result);
    }
  );

  // 29. port_get_jobs_by_state — GET /api/v1/port-projects/jobs/state/{state}
  server.tool(
    "port_get_jobs_by_state",
    "Use this tool when you need to list all bulk port jobs that are in a specific processing state.",
    {
      state: z
        .string()
        .describe("The job state to filter by (e.g., PENDING, RUNNING, COMPLETED, FAILED)."),
      page: z
        .number()
        .int()
        .describe("Optional zero-based page number for pagination.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of results per page.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ state, page, size }) => {
      const result = await client.get(`/api/v1/port-projects/jobs/state/${state}`, { page, size });
      return formatResponse(result);
    }
  );

  // 30. port_get_project_job_status — GET /api/v1/port-projects/jobs/project/{projectId}/status
  server.tool(
    "port_get_project_job_status",
    "Use this tool when you need to check the current job status for all jobs associated with a specific bulk port project.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project to retrieve job status for."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ projectId }) => {
      const result = await client.get(`/api/v1/port-projects/jobs/project/${projectId}/status`);
      return formatResponse(result);
    }
  );

  // 31. port_get_failed_jobs — GET /api/v1/port-projects/jobs/failed
  server.tool(
    "port_get_failed_jobs",
    "Use this tool when you need to list all failed bulk port jobs so you can identify and retry them.",
    {
      page: z
        .number()
        .int()
        .describe("Optional zero-based page number for pagination.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of results per page.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ page, size }) => {
      const result = await client.get("/api/v1/port-projects/jobs/failed", { page, size });
      return formatResponse(result);
    }
  );

  // 32. port_retry_job — POST /api/v1/port-projects/jobs/retry/{jobId}
  server.tool(
    "port_retry_job",
    "Use this tool when you need to retry a specific failed bulk port job by its job ID.",
    {
      jobId: z
        .string()
        .describe("The unique identifier of the failed bulk port job to retry."),
    },
    async ({ jobId }) => {
      const result = await client.post(`/api/v1/port-projects/jobs/retry/${jobId}`);
      return formatResponse(result);
    }
  );

  // 33. port_retry_project_jobs — POST /api/v1/port-projects/jobs/retry/project/{projectId}
  server.tool(
    "port_retry_project_jobs",
    "Use this tool when you need to retry all failed jobs for a specific bulk port project at once.",
    {
      projectId: z
        .string()
        .describe("The unique identifier of the bulk port project whose failed jobs should be retried."),
    },
    async ({ projectId }) => {
      const result = await client.post(`/api/v1/port-projects/jobs/retry/project/${projectId}`);
      return formatResponse(result);
    }
  );

  // 34. port_cancel_job — DELETE /api/v1/port-projects/jobs/{jobId}
  server.tool(
    "port_cancel_job",
    "Use this tool when you need to cancel a pending or running bulk port job to prevent it from executing.",
    {
      jobId: z
        .string()
        .describe("The unique identifier of the bulk port job to cancel."),
    },
    async ({ jobId }) => {
      const result = await client.delete(`/api/v1/port-projects/jobs/${jobId}`);
      return formatResponse(result);
    }
  );
}
