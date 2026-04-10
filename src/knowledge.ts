import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerKnowledge(server: McpServer): void {
  server.prompt(
    "tniq-guide",
    "Comprehensive guide to TNIQ APIs — telecom porting, toll-free, messaging, inventory, and CNAM. Load this before answering domain questions.",
    () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: TNIQ_KNOWLEDGE,
          },
        },
      ],
    })
  );
}

export const TNIQ_KNOWLEDGE = `# TNIQ API Knowledge Base

You have access to TNIQ tools for managing telecom number operations. NEVER guess carrier names, SPIDs, LRNs, port statuses, or routing data — always query the API.

---

## Overview

TNIQ by Ringer is a telecom platform providing APIs for:
- **SOA Operations** — NPAC port request lifecycle (create, activate, cancel, release, disconnect, conflict, IntraSP)
- **Number Inventory** — Search, reserve, assign, release, audit, and report on telephone numbers
- **Toll-Free** — Somos TFN Registry integration (templates, search, reserve, activate PTR, disconnect)
- **Messaging / 10DLC** — TCR brand and campaign registration, CNP election, number assignment
- **CNAM** — Caller Name ID management via TransUnion
- **ROC** — Responsible Organization Change workflows for toll-free numbers
- **Bulk Port Projects** — Bulk port order management with validation, submission, and lifecycle tracking
- **Port-Out Releases** — NPAC release management for numbers leaving your network

---

## Tool Groups

### SOA Operations (soa_*)
Use for individual number porting operations against NPAC.

- **soa_get_status / soa_get_spid / soa_query** — Look up current port status, SPID, or detailed query for a TN
- **soa_get_events** — Poll for SOA events (new ports, conflicts, etc.)
- **soa_get_activation_ready** — Find numbers ready to activate for a given SPID
- **soa_activate** — Activate a ported number in NPAC
- **soa_cancel** — Cancel a pending port request
- **soa_release** — Release (approve) a port-out request
- **soa_disconnect** — Disconnect a number from NPAC
- **soa_create_conflict / soa_remove_conflict** — Manage port conflicts
- **soa_intrasp** — IntraSP transfer (same carrier, different LRN)
- **soa_create_lrn / soa_remove_lrn** — Manage LRN records in NPAC

**Common flow:** Query status → Create port → Wait for FOC → Activate

### Bulk Port Projects (port_*)
Use for managing large-scale porting operations with multiple TNs.

- **port_create_project** — Start a new bulk port project (requires customer_id, spid, name)
- **port_get_details** — View TNs with pagination, filtering by validation/lifecycle status
- **port_validate** — Trigger validation for all TNs
- **port_submit** — Submit validated TNs to SOA
- **port_bulk_actions** — Perform ACTIVATE, CANCEL, SUP_DDD, DELETE, REVALIDATE, SUBMIT, RESUBMIT on selected TNs
- **port_get_lifecycle_summary** — Quick overview of where all TNs are in the porting lifecycle
- **port_get_error_groups** — Group errors for batch resolution
- **port_auto_fix** — Apply automatic fixes for resolvable errors

**Lifecycle states:** DRAFT → VALIDATING → READY_FOR_SUBMISSION → PENDING_FOC → FOC_RECEIVED → AWAITING_DUE_DATE → READY_FOR_ACTIVATION → ACTIVATING → ACTIVATED

### Port-Out Releases (port_out_*)
Use when releasing numbers that are being ported away from your network.

- **port_out_lookup** — Look up TNs to determine source SPID and subscriber data
- **port_out_create_project** — Create a release project with TN subscriber details
- **port_out_submit** — Submit releases to NPAC with a due date

### Toll-Free (tf_*)
Use for Somos TFN Registry operations.

- **Templates** — tf_create_template, tf_update_template, tf_get_template, etc.
- **Search & Reserve** — tf_search_spare, tf_search_and_reserve, tf_reserve
- **Activate** — tf_activate (requires template name, effective date, service order number)
- **Drafts** — Save work-in-progress templates before pushing to Somos
- **Sync** — tf_start_sync to synchronize inventory with Somos

**Template workflow:** Create/update template → Save draft → Push to Somos → Activate TFNs with template

### ROC (roc_*)
Use for Responsible Organization Changes on toll-free numbers.

- **Outbound ROC:** roc_create_project → roc_upload_loa/roc_generate_loa → roc_submit
- **Inbound ROC:** roc_inbound_checkout → roc_inbound_process (approve/deny per TFN) → roc_inbound_checkin
- **roc_escalate_hdi** — Escalate stuck ROC to Somos Help Desk

### Messaging / 10DLC (msg_*)
Use for TCR brand/campaign registration and number assignment.

- **Brands:** msg_create_brand → msg_get_brand (wait for vetting) → msg_link_brand (if existing TCR brand)
- **Campaigns:** msg_create_campaign → msg_elect_cnp → msg_assign_numbers
- **Reference data:** msg_list_verticals, msg_list_use_cases, msg_list_entity_types, msg_list_mnos, msg_list_cnps
- **NNIDs:** Manage network node IDs for messaging routing

**Brand is required before creating campaigns. Campaign must be approved before assigning numbers.**

### Number Inventory (inv_*)
Use for managing your telephone number inventory.

- **inv_query** — Flexible search with query string syntax
- **inv_aggregate** — Group and count numbers by field (state, LATA, status, etc.)
- **inv_get_number** — Full details for a single TN
- **inv_reserve_number / inv_assign_number / inv_release_number** — Lifecycle management
- **inv_start_audit** — Compare inventory against NPAC to find discrepancies
- **inv_get_map_data** — Geographic visualization data

### CNAM (cnam_*)
Use for managing Caller Name ID records.

- **cnam_query** — Look up the CNAM record for a number
- **cnam_activate** — Set or update the displayed caller name (max 15 chars)
- **cnam_delete** — Remove a CNAM record

---

## Key Concepts

| Term | Definition |
|------|-----------|
| TN | Telephone Number — always 10 digits (NPA + NXX + line) |
| SPID | Service Provider ID — 4-character alphanumeric code identifying a carrier |
| LRN | Location Routing Number — 10-digit number used for routing ported calls |
| NPAC | Number Portability Administration Center — central database for ported numbers |
| SOA | Service Order Administration — interface for submitting port requests to NPAC |
| FOC | Firm Order Confirmation — carrier acknowledgment that a port will proceed |
| DDD | Desired Due Date — when the port should activate |
| OCN | Operating Company Number — identifies the carrier operating a switch |
| LATA | Local Access and Transport Area — geographic region for telecom routing |
| RespOrg | Responsible Organization — entity managing toll-free numbers in Somos |
| ROC | Responsible Organization Change — transferring TFN management to a new RespOrg |
| TCR | The Campaign Registry — central registry for 10DLC messaging campaigns |
| CNP | Connectivity Partner — messaging aggregator that provides network connectivity |
| NNID | Network Node ID — identifier for messaging routing nodes |
| CNAM | Caller Name — the name displayed on caller ID |
| IntraSP | Intra-Service Provider — moving a number within the same carrier to a new LRN |
| CPR | Call Processing Record — routing rules for toll-free numbers |
| PTR | Pointer Record — maps a toll-free number to a template/CPR |

---

## Common Mistakes to Avoid

1. **Don't guess SPIDs or carrier names** — Use soa_get_spid or soa_query to look up the current SPID for a TN
2. **Don't activate before FOC** — A port must receive FOC and reach its due date before activation
3. **Don't skip validation in bulk ports** — Always run port_validate before port_submit
4. **Don't confuse TN and LRN** — The TN is the customer-facing number; the LRN is for routing
5. **ROC requires LOA** — Most ROC submissions need a Letter of Authorization uploaded first
6. **TCR brand before campaign** — You must create/link a brand before creating a 10DLC campaign
7. **CNAM is max 15 characters** — The caller name field has a strict 15-character limit
8. **Template before toll-free activation** — TFNs must be activated with a template name and effective date
9. **Use port_get_lifecycle_summary for quick status** — Don't fetch all TN details just to count states
10. **Check port_get_error_groups before manual fixes** — Many errors have auto-fix available
`;
