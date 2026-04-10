import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TniqClient } from "../client.js";
import { formatResponse, errorResult } from "../utils/formatting.js";
import { READ_ONLY_ANNOTATIONS } from "../annotations.js";
import { isValidTn, isValidSpid } from "../utils/validation.js";

export function registerInventoryTools(server: McpServer, client: TniqClient): void {
  // ─── Number Details & Actions ─────────────────────────────────────────────

  // 1. inv_get_number — GET /api/v1/inventory/numbers/{telephoneNumber}
  server.tool(
    "inv_get_number",
    "Use this tool when you need to retrieve the full inventory details for a specific telephone number, including its status, SPID ownership, and metadata.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number to retrieve inventory details for.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
      spid: z
        .string()
        .describe("Optional 4-character Service Provider ID to scope the lookup to a specific SPID.")
        .refine(isValidSpid, { message: "spid must be exactly 4 alphanumeric characters" })
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ telephoneNumber, spid }) => {
      const result = await client.get(`/api/v1/inventory/numbers/${telephoneNumber}`, { spid });
      return formatResponse(result);
    }
  );

  // 2. inv_reserve_number — POST /api/v1/inventory/numbers/{telephoneNumber}/reserve
  server.tool(
    "inv_reserve_number",
    "Use this tool when you need to reserve a telephone number in inventory, optionally attaching metadata, to prevent it from being assigned to another party.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number to reserve.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
      body: z
        .record(z.unknown())
        .describe("Optional passthrough metadata object to associate with the reservation.")
        .optional(),
    },
    async ({ telephoneNumber, body }) => {
      const result = await client.post(`/api/v1/inventory/numbers/${telephoneNumber}/reserve`, body);
      return formatResponse(result);
    }
  );

  // 3. inv_release_number — POST /api/v1/inventory/numbers/{telephoneNumber}/release
  server.tool(
    "inv_release_number",
    "Use this tool when you need to release a reserved or assigned telephone number back to the available inventory pool.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number to release back to inventory.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
    },
    async ({ telephoneNumber }) => {
      const result = await client.post(`/api/v1/inventory/numbers/${telephoneNumber}/release`);
      return formatResponse(result);
    }
  );

  // 4. inv_assign_number — POST /api/v1/inventory/numbers/{telephoneNumber}/assign
  server.tool(
    "inv_assign_number",
    "Use this tool when you need to assign a telephone number from inventory to a subscriber or service, along with required metadata.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number to assign.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
      body: z
        .record(z.unknown())
        .describe("Passthrough metadata object containing assignment details (e.g., subscriber information)."),
    },
    async ({ telephoneNumber, body }) => {
      const result = await client.post(`/api/v1/inventory/numbers/${telephoneNumber}/assign`, body);
      return formatResponse(result);
    }
  );

  // 5. inv_update_metadata — PUT /api/v1/inventory/numbers/{telephoneNumber}/metadata
  server.tool(
    "inv_update_metadata",
    "Use this tool when you need to update the metadata fields attached to an existing inventory number record.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number whose metadata to update.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
      body: z
        .record(z.unknown())
        .describe("Passthrough metadata object containing the updated metadata fields and values."),
    },
    async ({ telephoneNumber, body }) => {
      const result = await client.put(`/api/v1/inventory/numbers/${telephoneNumber}/metadata`, body);
      return formatResponse(result);
    }
  );

  // 6. inv_get_portable — GET /api/v1/inventory/numbers/{telephoneNumber}/portable
  server.tool(
    "inv_get_portable",
    "Use this tool when you need to check whether a telephone number is currently marked as portable in inventory.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number to check portable status for.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ telephoneNumber }) => {
      const result = await client.get(`/api/v1/inventory/numbers/${telephoneNumber}/portable`);
      return formatResponse(result);
    }
  );

  // 7. inv_mark_portable — POST /api/v1/inventory/numbers/{telephoneNumber}/portable
  server.tool(
    "inv_mark_portable",
    "Use this tool when you need to mark a telephone number as portable in inventory, enabling it for LNP porting operations.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number to mark as portable.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
      body: z
        .record(z.unknown())
        .describe("Passthrough object containing portable configuration details."),
    },
    async ({ telephoneNumber, body }) => {
      const result = await client.post(`/api/v1/inventory/numbers/${telephoneNumber}/portable`, body);
      return formatResponse(result);
    }
  );

  // 8. inv_clear_portable — DELETE /api/v1/inventory/numbers/{telephoneNumber}/portable
  server.tool(
    "inv_clear_portable",
    "Use this tool when you need to remove the portable designation from a telephone number in inventory.",
    {
      telephoneNumber: z
        .string()
        .describe("The 10-digit telephone number to clear the portable status from.")
        .refine(isValidTn, { message: "telephoneNumber must be exactly 10 digits" }),
    },
    async ({ telephoneNumber }) => {
      const result = await client.delete(`/api/v1/inventory/numbers/${telephoneNumber}/portable`);
      return formatResponse(result);
    }
  );

  // ─── By ID variants ───────────────────────────────────────────────────────

  // 9. inv_reserve_by_id — POST /api/v1/inventory/numbers/by-id/{id}/reserve
  server.tool(
    "inv_reserve_by_id",
    "Use this tool when you need to reserve an inventory number by its internal record ID rather than the telephone number itself.",
    {
      id: z
        .string()
        .describe("The internal inventory record ID of the number to reserve."),
      body: z
        .record(z.unknown())
        .describe("Optional passthrough metadata object to associate with the reservation.")
        .optional(),
    },
    async ({ id, body }) => {
      const result = await client.post(`/api/v1/inventory/numbers/by-id/${id}/reserve`, body);
      return formatResponse(result);
    }
  );

  // 10. inv_release_by_id — POST /api/v1/inventory/numbers/by-id/{id}/release
  server.tool(
    "inv_release_by_id",
    "Use this tool when you need to release an inventory number back to the available pool using its internal record ID.",
    {
      id: z
        .string()
        .describe("The internal inventory record ID of the number to release."),
    },
    async ({ id }) => {
      const result = await client.post(`/api/v1/inventory/numbers/by-id/${id}/release`);
      return formatResponse(result);
    }
  );

  // 11. inv_assign_by_id — POST /api/v1/inventory/numbers/by-id/{id}/assign
  server.tool(
    "inv_assign_by_id",
    "Use this tool when you need to assign an inventory number to a subscriber using the number's internal record ID instead of the telephone number.",
    {
      id: z
        .string()
        .describe("The internal inventory record ID of the number to assign."),
      body: z
        .record(z.unknown())
        .describe("Passthrough metadata object containing assignment details (e.g., subscriber information)."),
    },
    async ({ id, body }) => {
      const result = await client.post(`/api/v1/inventory/numbers/by-id/${id}/assign`, body);
      return formatResponse(result);
    }
  );

  // 12. inv_update_metadata_by_id — PUT /api/v1/inventory/numbers/by-id/{id}/metadata
  server.tool(
    "inv_update_metadata_by_id",
    "Use this tool when you need to update metadata on an inventory number record using its internal record ID.",
    {
      id: z
        .string()
        .describe("The internal inventory record ID of the number whose metadata to update."),
      body: z
        .record(z.unknown())
        .describe("Passthrough metadata object containing the updated metadata fields and values."),
    },
    async ({ id, body }) => {
      const result = await client.put(`/api/v1/inventory/numbers/by-id/${id}/metadata`, body);
      return formatResponse(result);
    }
  );

  // ─── Summary ──────────────────────────────────────────────────────────────

  // 13. inv_get_summary — GET /api/v1/inventory/summary
  server.tool(
    "inv_get_summary",
    "Use this tool when you need a high-level summary of inventory counts and statuses (available, reserved, assigned, etc.) for a given SPID.",
    {
      spid: z
        .string()
        .describe("The 4-character Service Provider ID to retrieve the inventory summary for.")
        .refine(isValidSpid, { message: "spid must be exactly 4 alphanumeric characters" }),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ spid }) => {
      const result = await client.get("/api/v1/inventory/summary", { spid });
      return formatResponse(result);
    }
  );

  // ─── Query ────────────────────────────────────────────────────────────────

  // 14. inv_query — POST /api/v1/inventory/query
  server.tool(
    "inv_query",
    "Use this tool when you need to search and filter inventory numbers using a query expression, with support for pagination and sorting.",
    {
      query: z
        .string()
        .describe("Optional query expression string to filter inventory results (e.g., 'status:AVAILABLE').")
        .optional(),
      page: z
        .number()
        .int()
        .describe("Optional zero-based page number for paginated results.")
        .optional(),
      size: z
        .number()
        .int()
        .describe("Optional number of results per page.")
        .optional(),
      sortBy: z
        .string()
        .describe("Optional field name to sort results by.")
        .optional(),
      sortDirection: z
        .string()
        .describe("Optional sort direction, either 'ASC' or 'DESC'.")
        .optional(),
      spids: z
        .array(z.string())
        .describe("Optional array of 4-character SPID strings to filter results to specific service providers.")
        .optional(),
      fields: z
        .array(z.string())
        .describe("Optional array of field names to include in each result record.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ query, page, size, sortBy, sortDirection, spids, fields }) => {
      const body: Record<string, unknown> = {};
      if (query !== undefined) body.query = query;
      if (page !== undefined) body.page = page;
      if (size !== undefined) body.size = size;
      if (sortBy !== undefined) body.sortBy = sortBy;
      if (sortDirection !== undefined) body.sortDirection = sortDirection;
      if (spids !== undefined) body.spids = spids;
      if (fields !== undefined) body.fields = fields;
      const result = await client.post("/api/v1/inventory/query", body);
      return formatResponse(result);
    }
  );

  // 15. inv_validate_query — POST /api/v1/inventory/query/validate
  server.tool(
    "inv_validate_query",
    "Use this tool when you need to validate an inventory query expression before executing it, to check for syntax errors without running a full search.",
    {
      body: z
        .record(z.unknown())
        .describe("Passthrough object containing the query expression and parameters to validate."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ body }) => {
      const result = await client.post("/api/v1/inventory/query/validate", body);
      return formatResponse(result);
    }
  );

  // 16. inv_export — POST /api/v1/inventory/query/export
  server.tool(
    "inv_export",
    "Use this tool when you need to export inventory records matching a query to a CSV file for bulk download or reporting purposes.",
    {
      query: z
        .string()
        .describe("Optional query expression string to filter the records to export.")
        .optional(),
      spids: z
        .array(z.string())
        .describe("Optional array of 4-character SPID strings to restrict the export to specific service providers.")
        .optional(),
      sortBy: z
        .string()
        .describe("Optional field name to sort the exported records by.")
        .optional(),
      sortDirection: z
        .string()
        .describe("Optional sort direction for the export, either 'ASC' or 'DESC'.")
        .optional(),
      fields: z
        .array(z.string())
        .describe("Optional array of field names to include as columns in the CSV export.")
        .optional(),
    },
    async ({ query, spids, sortBy, sortDirection, fields }) => {
      const body: Record<string, unknown> = {};
      if (query !== undefined) body.query = query;
      if (spids !== undefined) body.spids = spids;
      if (sortBy !== undefined) body.sortBy = sortBy;
      if (sortDirection !== undefined) body.sortDirection = sortDirection;
      if (fields !== undefined) body.fields = fields;
      const result = await client.post("/api/v1/inventory/query/export", body);
      return formatResponse(result);
    }
  );

  // 17. inv_aggregate — POST /api/v1/inventory/aggregate
  server.tool(
    "inv_aggregate",
    "Use this tool when you need to aggregate inventory data by one or more fields to get counts or grouped statistics across the inventory.",
    {
      query: z
        .string()
        .describe("Optional query expression string to pre-filter the records before aggregation.")
        .optional(),
      spids: z
        .array(z.string())
        .describe("Optional array of 4-character SPID strings to restrict aggregation to specific service providers.")
        .optional(),
      groupBy: z
        .array(z.string())
        .describe("Optional array of field names to group the aggregation results by.")
        .optional(),
      limit: z
        .number()
        .int()
        .describe("Optional maximum number of aggregation result buckets to return.")
        .optional(),
      orderBy: z
        .string()
        .describe("Optional field name or expression to order the aggregation results by.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ query, spids, groupBy, limit, orderBy }) => {
      const body: Record<string, unknown> = {};
      if (query !== undefined) body.query = query;
      if (spids !== undefined) body.spids = spids;
      if (groupBy !== undefined) body.groupBy = groupBy;
      if (limit !== undefined) body.limit = limit;
      if (orderBy !== undefined) body.orderBy = orderBy;
      const result = await client.post("/api/v1/inventory/aggregate", body);
      return formatResponse(result);
    }
  );

  // ─── Map ──────────────────────────────────────────────────────────────────

  // 18. inv_get_map_states — GET /api/v1/inventory/map/states
  server.tool(
    "inv_get_map_states",
    "Use this tool when you need to retrieve the list of US states available for inventory map filtering.",
    {},
    READ_ONLY_ANNOTATIONS,
    async () => {
      const result = await client.get("/api/v1/inventory/map/states");
      return formatResponse(result);
    }
  );

  // 19. inv_get_map_latas — GET /api/v1/inventory/map/latas
  server.tool(
    "inv_get_map_latas",
    "Use this tool when you need to retrieve available LATAs for inventory map filtering, optionally scoped to a specific state.",
    {
      state: z
        .string()
        .describe("Optional 2-character US state abbreviation to filter LATAs by (e.g., 'TX').")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ state }) => {
      const result = await client.get("/api/v1/inventory/map/latas", { state });
      return formatResponse(result);
    }
  );

  // 20. inv_get_map_rate_centers — GET /api/v1/inventory/map/rate-centers
  server.tool(
    "inv_get_map_rate_centers",
    "Use this tool when you need to retrieve available rate centers for inventory map filtering, optionally scoped to a state and/or LATA.",
    {
      state: z
        .string()
        .describe("Optional 2-character US state abbreviation to filter rate centers by (e.g., 'TX').")
        .optional(),
      lata: z
        .number()
        .int()
        .describe("Optional numeric LATA code to filter rate centers to a specific LATA.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ state, lata }) => {
      const result = await client.get("/api/v1/inventory/map/rate-centers", { state, lata });
      return formatResponse(result);
    }
  );

  // 21. inv_get_map_data — POST /api/v1/inventory/map/data
  server.tool(
    "inv_get_map_data",
    "Use this tool when you need to retrieve inventory availability map data grouped by a geographic region type, such as states, LATAs, rate centers, ZIP codes, or NPA-NXX.",
    {
      regionType: z
        .enum(["STATE", "LATA", "RATE_CENTER", "ZIP_CODE", "NPA_NXX"])
        .describe("The geographic region type to group map data by: STATE, LATA, RATE_CENTER, ZIP_CODE, or NPA_NXX.")
        .optional(),
      states: z
        .array(z.string())
        .describe("Optional array of 2-character US state abbreviations to filter the map data.")
        .optional(),
      latas: z
        .array(z.string())
        .describe("Optional array of LATA codes to filter the map data.")
        .optional(),
      spids: z
        .array(z.string())
        .describe("Optional array of 4-character SPID strings to restrict map data to specific service providers.")
        .optional(),
      localities: z
        .array(z.string())
        .describe("Optional array of locality or rate center names to filter the map data.")
        .optional(),
      npas: z
        .array(z.string())
        .describe("Optional array of NPA (area code) strings to filter the map data.")
        .optional(),
      minAvailabilityPercentage: z
        .number()
        .describe("Optional minimum availability percentage threshold to include in results.")
        .optional(),
      maxAvailabilityPercentage: z
        .number()
        .describe("Optional maximum availability percentage threshold to include in results.")
        .optional(),
      minAvailableCount: z
        .number()
        .int()
        .describe("Optional minimum count of available numbers a region must have to be included in results.")
        .optional(),
      includeEmpty: z
        .boolean()
        .describe("Optional flag indicating whether to include regions with zero available numbers in results.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({
      regionType,
      states,
      latas,
      spids,
      localities,
      npas,
      minAvailabilityPercentage,
      maxAvailabilityPercentage,
      minAvailableCount,
      includeEmpty,
    }) => {
      const body: Record<string, unknown> = {};
      if (regionType !== undefined) body.regionType = regionType;
      if (states !== undefined) body.states = states;
      if (latas !== undefined) body.latas = latas;
      if (spids !== undefined) body.spids = spids;
      if (localities !== undefined) body.localities = localities;
      if (npas !== undefined) body.npas = npas;
      if (minAvailabilityPercentage !== undefined) body.minAvailabilityPercentage = minAvailabilityPercentage;
      if (maxAvailabilityPercentage !== undefined) body.maxAvailabilityPercentage = maxAvailabilityPercentage;
      if (minAvailableCount !== undefined) body.minAvailableCount = minAvailableCount;
      if (includeEmpty !== undefined) body.includeEmpty = includeEmpty;
      const result = await client.post("/api/v1/inventory/map/data", body);
      return formatResponse(result);
    }
  );

  // ─── Audit ────────────────────────────────────────────────────────────────

  // 22. inv_start_audit — POST /api/v1/inventory/audit/start
  server.tool(
    "inv_start_audit",
    "Use this tool when you need to start an inventory audit for a SPID to reconcile inventory records against the authoritative source.",
    {
      spid: z
        .string()
        .describe("The 4-character Service Provider ID to run the audit against.")
        .refine(isValidSpid, { message: "spid must be exactly 4 alphanumeric characters" }),
      phaseSelection: z
        .enum(["ALL", "PHASE_1_ONLY", "PHASE_2_ONLY", "PHASE_3_ONLY"])
        .describe("Optional audit phase selection: ALL, PHASE_1_ONLY, PHASE_2_ONLY, or PHASE_3_ONLY.")
        .optional(),
      purgeInventoryFirst: z
        .boolean()
        .describe("Optional flag indicating whether to purge existing inventory records before running the audit.")
        .optional(),
      includeCnam: z
        .boolean()
        .describe("Optional flag indicating whether to include CNAM data in the audit.")
        .optional(),
      autoCommit: z
        .boolean()
        .describe("Optional flag indicating whether to automatically commit the audit results without a manual review step.")
        .optional(),
    },
    async ({ spid, phaseSelection, purgeInventoryFirst, includeCnam, autoCommit }) => {
      const body: Record<string, unknown> = { spid };
      if (phaseSelection !== undefined) body.phaseSelection = phaseSelection;
      if (purgeInventoryFirst !== undefined) body.purgeInventoryFirst = purgeInventoryFirst;
      if (includeCnam !== undefined) body.includeCnam = includeCnam;
      if (autoCommit !== undefined) body.autoCommit = autoCommit;
      const result = await client.post("/api/v1/inventory/audit/start", body);
      return formatResponse(result);
    }
  );

  // 23. inv_get_audit_status — GET /api/v1/inventory/audit/{auditJobId}
  server.tool(
    "inv_get_audit_status",
    "Use this tool when you need to check the current status and progress of a running or completed inventory audit job.",
    {
      auditJobId: z
        .string()
        .describe("The unique identifier of the audit job to retrieve status for."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ auditJobId }) => {
      const result = await client.get(`/api/v1/inventory/audit/${auditJobId}`);
      return formatResponse(result);
    }
  );

  // 24. inv_cancel_audit — DELETE /api/v1/inventory/audit/{auditJobId}
  server.tool(
    "inv_cancel_audit",
    "Use this tool when you need to cancel an in-progress inventory audit job before it completes.",
    {
      auditJobId: z
        .string()
        .describe("The unique identifier of the audit job to cancel."),
    },
    async ({ auditJobId }) => {
      const result = await client.delete(`/api/v1/inventory/audit/${auditJobId}`);
      return formatResponse(result);
    }
  );

  // 25. inv_get_audit_diff — GET /api/v1/inventory/audit/{auditJobId}/diff
  server.tool(
    "inv_get_audit_diff",
    "Use this tool when you need to retrieve a summary of the differences found between the current inventory and the authoritative source after an audit completes.",
    {
      auditJobId: z
        .string()
        .describe("The unique identifier of the completed audit job to retrieve the diff summary for."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ auditJobId }) => {
      const result = await client.get(`/api/v1/inventory/audit/${auditJobId}/diff`);
      return formatResponse(result);
    }
  );

  // 26. inv_download_audit_diff — GET /api/v1/inventory/audit/{auditJobId}/diff/download
  server.tool(
    "inv_download_audit_diff",
    "Use this tool when you need to download the full audit diff report file for a completed audit job.",
    {
      auditJobId: z
        .string()
        .describe("The unique identifier of the completed audit job whose diff report to download."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ auditJobId }) => {
      const result = await client.get(`/api/v1/inventory/audit/${auditJobId}/diff/download`);
      return formatResponse(result);
    }
  );

  // 27. inv_commit_audit — POST /api/v1/inventory/audit/{auditJobId}/commit
  server.tool(
    "inv_commit_audit",
    "Use this tool when you need to commit a dry-run audit, applying the discovered differences to update the live inventory records.",
    {
      auditJobId: z
        .string()
        .describe("The unique identifier of the dry-run audit job to commit."),
    },
    async ({ auditJobId }) => {
      const result = await client.post(`/api/v1/inventory/audit/${auditJobId}/commit`);
      return formatResponse(result);
    }
  );

  // 28. inv_reject_audit — POST /api/v1/inventory/audit/{auditJobId}/reject
  server.tool(
    "inv_reject_audit",
    "Use this tool when you need to reject a dry-run audit, discarding the discovered differences without updating inventory.",
    {
      auditJobId: z
        .string()
        .describe("The unique identifier of the dry-run audit job to reject."),
    },
    async ({ auditJobId }) => {
      const result = await client.post(`/api/v1/inventory/audit/${auditJobId}/reject`);
      return formatResponse(result);
    }
  );

  // 29. inv_get_audit_history — GET /api/v1/inventory/audit/history
  server.tool(
    "inv_get_audit_history",
    "Use this tool when you need to retrieve the history of past audit jobs for a given SPID.",
    {
      spid: z
        .string()
        .describe("The 4-character Service Provider ID to retrieve audit history for.")
        .refine(isValidSpid, { message: "spid must be exactly 4 alphanumeric characters" }),
      limit: z
        .number()
        .int()
        .describe("Optional maximum number of audit history records to return.")
        .optional(),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ spid, limit }) => {
      const result = await client.get("/api/v1/inventory/audit/history", { spid, limit });
      return formatResponse(result);
    }
  );

  // ─── Reports ──────────────────────────────────────────────────────────────

  // 30. inv_get_nruf_report — GET /api/v1/inventory/reports/nruf
  server.tool(
    "inv_get_nruf_report",
    "Use this tool when you need to generate a Number Resource Utilization/Forecast (NRUF) report for a given SPID to support FCC reporting requirements.",
    {
      spid: z
        .string()
        .describe("The 4-character Service Provider ID to generate the NRUF report for.")
        .refine(isValidSpid, { message: "spid must be exactly 4 alphanumeric characters" }),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ spid }) => {
      const result = await client.get("/api/v1/inventory/reports/nruf", { spid });
      return formatResponse(result);
    }
  );
}
