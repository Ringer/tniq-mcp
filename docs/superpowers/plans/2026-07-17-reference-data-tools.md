# Reference-data MCP Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add nine read-only MCP tools exposing the TNIQ Customer API's credentialed reference-data surface (CIC, NNID, Resp Org, SPID).

**Architecture:** One new module `src/tools/reference-data.ts` exporting `registerReferenceDataTools(server, client)`, wired into `src/index.ts` — identical in shape to every existing tool group. Tools reuse the existing `TniqClient`, Zod input schemas, `READ_ONLY_ANNOTATIONS`, and `formatResponse`. The API enforces the data-disclosure boundary structurally, so tools pass responses through faithfully and encode the boundary in descriptions.

**Tech Stack:** TypeScript (ESM, `tsc`), `zod`, `@modelcontextprotocol/sdk`. No test framework (repo convention is build + manual smoke).

## Global Constraints

- All nine tools are read-only and carry `READ_ONLY_ANNOTATIONS` — **including `ref_resolve_cics`**, which is a POST but non-mutating.
- API paths use the `/v1/...` prefix (this branch is stacked on the `/api/v1`→`/v1` canonicalization).
- Optional query params are forwarded by passing them straight into `client.get(path, {…})`; `TniqClient.buildUrl` drops `undefined` values. Do not manually prune.
- Pagination: `page` = integer ≥ 0 (default 0); `size` = integer 1–200 (default 50). `sort` defaults per endpoint.
- SPID identifiers are four-character uppercase alphanumeric — validate `^[A-Za-z0-9]{4}$` (reuse `isValidSpid`) and uppercase before use.
- `ref_resolve_cics.cics` is bounded to **1–100** items (stricter documented bound; machine schema says 500).
- Path params are `encodeURIComponent`-escaped.
- No admin surface (`/v1/admin/reference-data/*`). No real Resp Org / SPID / NNID contact values in docs, examples, or committed knowledge.
- Every tool description ends with the credential note and, where relevant, the NNID and NPAC-vs-live-SPID distinctions (verbatim strings supplied in Task 1).

---

### Task 1: Module scaffold + CIC tools + wiring + spec commit

**Files:**
- Create: `src/tools/reference-data.ts`
- Modify: `src/index.ts` (import + call, near line 40–74)
- Commit: `tniq-api.json` (already regenerated via `npm run sync-spec`, 248 paths)
- Check harness: `<SCRATCHPAD>/check-ref-tools.mjs` (create)

**Interfaces:**
- Produces: `export function registerReferenceDataTools(server: McpServer, client: TniqClient): void`
- Produces (module-level consts reused by later tasks): `CREDENTIAL_NOTE: string`, `pageField`, `sizeField`, `activeField` (Zod schemas).
- Consumes: `formatResponse` from `../utils/formatting.js`, `READ_ONLY_ANNOTATIONS` from `../annotations.js`, `isValidSpid` from `../utils/validation.js`.

- [ ] **Step 1: Create the module with shared fields and the three CIC tools**

Create `src/tools/reference-data.ts`:

```ts
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
}
```

- [ ] **Step 2: Wire the module into `src/index.ts`**

Add the import alongside the other `registerXTools` imports (after the `registerReportTools` import, ~line 40):

```ts
  const { registerReferenceDataTools } = await import(
    "./tools/reference-data.js"
  );
```

Add the registration call alongside the others (after `registerReportTools(server, client);`, ~line 74):

```ts
  registerReferenceDataTools(server, client);
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exits 0, no TypeScript errors. Produces `dist/tools/reference-data.js`.

- [ ] **Step 4: Create the registration check harness and run it**

Create `<SCRATCHPAD>/check-ref-tools.mjs` (replace `<SCRATCHPAD>` with the session scratchpad path):

```js
const mod = await import(
  "/Users/davidaldworth/Repos/tniq-mcp/dist/tools/reference-data.js"
);
const names = [];
mod.registerReferenceDataTools({ tool: (n) => names.push(n) }, {});
const refNames = names.filter((n) => n.startsWith("ref_"));
const want = Number(process.argv[2] || refNames.length);
console.log(`registered ${refNames.length} ref_ tools:`, refNames.join(", "));
if (refNames.length !== want) {
  console.error(`FAIL: expected ${want}`);
  process.exit(1);
}
console.log("OK");
```

Run: `node <SCRATCHPAD>/check-ref-tools.mjs 3`
Expected: `registered 3 ref_ tools: ref_search_cics, ref_get_cic, ref_resolve_cics` then `OK`.

- [ ] **Step 5: Verify index wiring is present in build output**

Run: `grep -c registerReferenceDataTools dist/index.js`
Expected: `2` (one import, one call).

- [ ] **Step 6: Commit**

```bash
git add src/tools/reference-data.ts src/index.ts tniq-api.json
git commit -m "feat: reference-data CIC tools + regenerated spec (#6)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: NNID tools

**Files:**
- Modify: `src/tools/reference-data.ts` (append two tools inside `registerReferenceDataTools`, after the CIC block)

**Interfaces:**
- Consumes: `CREDENTIAL_NOTE`, `activeField`, `pageField`, `sizeField` (Task 1).
- Produces: tools `ref_search_nnids`, `ref_get_nnid`.

- [ ] **Step 1: Append the NNID tools**

Insert after the `ref_resolve_cics` `server.tool(...)` call, before the closing `}` of `registerReferenceDataTools`:

```ts
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
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exits 0, no errors.

- [ ] **Step 3: Run the check harness**

Run: `node <SCRATCHPAD>/check-ref-tools.mjs 5`
Expected: lists 5 ref_ tools ending `ref_search_nnids, ref_get_nnid`, then `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/tools/reference-data.ts
git commit -m "feat: reference-data NNID directory tools (#6)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Resp Org tools

**Files:**
- Modify: `src/tools/reference-data.ts` (append two tools after the NNID block)

**Interfaces:**
- Consumes: `CREDENTIAL_NOTE`, `activeField`, `pageField`, `sizeField` (Task 1).
- Produces: tools `ref_search_resp_orgs`, `ref_get_resp_org`.

- [ ] **Step 1: Append the Resp Org tools**

Insert after the `ref_get_nnid` `server.tool(...)` call:

```ts
  // ─── Resp Org (published Somos Resp Org identities; list = identity
  //     summaries, detail = full order-processing contacts) ──────────────────

  server.tool(
    "ref_search_resp_orgs",
    "Use when you need to search published Somos Resp Org identities by " +
      "company name or entity ID. Returns identity summaries only; open a " +
      "single Resp Org ID for its complete order-processing contact detail." +
      CREDENTIAL_NOTE,
    {
      search: z
        .string()
        .optional()
        .describe("Free-text search across Resp Org ID and company name."),
      entityId: z
        .string()
        .optional()
        .describe("Filter by Somos entity ID."),
      active: activeField,
      page: pageField,
      size: sizeField,
      sort: z
        .string()
        .optional()
        .describe("Sort spec, e.g. 'respOrgId,asc' (default)."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ search, entityId, active, page, size, sort }) => {
      const data = await client.get("/v1/reference-data/resp-orgs", {
        search,
        entityId,
        active,
        page,
        size,
        sort,
      });
      return formatResponse(data);
    }
  );

  server.tool(
    "ref_get_resp_org",
    "Use when you need the complete published Somos Resp Org record for one " +
      "Resp Org ID, including company address, primary and change contacts, " +
      "and notes." +
      CREDENTIAL_NOTE,
    {
      respOrgId: z.string().describe("The Resp Org ID to inspect."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ respOrgId }) => {
      const data = await client.get(
        `/v1/reference-data/resp-orgs/${encodeURIComponent(respOrgId)}`
      );
      return formatResponse(data);
    }
  );
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exits 0, no errors.

- [ ] **Step 3: Run the check harness**

Run: `node <SCRATCHPAD>/check-ref-tools.mjs 7`
Expected: lists 7 ref_ tools ending `ref_search_resp_orgs, ref_get_resp_org`, then `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/tools/reference-data.ts
git commit -m "feat: reference-data Resp Org tools (#6)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: SPID tools (credentialed / NPAC contacts)

**Files:**
- Modify: `src/tools/reference-data.ts` (append two tools after the Resp Org block)

**Interfaces:**
- Consumes: `CREDENTIAL_NOTE`, `activeField`, `pageField`, `sizeField` (Task 1); `isValidSpid` (import already present from Task 1).
- Produces: tools `ref_search_spids`, `ref_get_spid`.

- [ ] **Step 1: Append the SPID tools**

Insert after the `ref_get_resp_org` `server.tool(...)` call:

```ts
  // ─── SPID (published NPAC registration identities; list = identity +
  //     contactCount only, NEVER contact values; detail = contacts for the
  //     requested SPID only. Credentialed: KYC-vetted, NPAC-rights accounts) ──

  server.tool(
    "ref_search_spids",
    "Use when you need to search published NPAC SPID registration identities " +
      "(credentialed — requires a KYC-vetted account with NPAC rights). " +
      "Returns identity summaries and a contact count only — never contact " +
      "values; open a single SPID for its published registration contacts. " +
      "NPAC registration contacts are distinct from the SPID observed on live " +
      "Telique/LSMS number data and from your customer SPID " +
      "entitlement/configuration." +
      CREDENTIAL_NOTE,
    {
      search: z
        .string()
        .optional()
        .describe("Free-text search across SPID and registered customer names."),
      region: z.string().optional().describe("Filter by NPAC region."),
      active: activeField,
      page: pageField,
      size: sizeField,
      sort: z
        .string()
        .optional()
        .describe("Sort spec, e.g. 'spid,asc' (default)."),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ search, region, active, page, size, sort }) => {
      const data = await client.get("/v1/reference-data/spids", {
        search,
        region,
        active,
        page,
        size,
        sort,
      });
      return formatResponse(data);
    }
  );

  server.tool(
    "ref_get_spid",
    "Use when you need the published NPAC registration contacts for one " +
      "four-character SPID (credentialed — KYC-vetted, NPAC-rights accounts " +
      "only). Returns published registration contacts for the requested SPID " +
      "only. These NPAC registration contacts are distinct from the live " +
      "SPID-on-number seen via Telique/LSMS and from customer SPID entitlement." +
      CREDENTIAL_NOTE,
    {
      spid: z
        .string()
        .describe("The four-character SPID to inspect (case-insensitive).")
        .refine(isValidSpid, {
          message: "spid must be exactly 4 alphanumeric characters",
        }),
    },
    READ_ONLY_ANNOTATIONS,
    async ({ spid }) => {
      const data = await client.get(
        `/v1/reference-data/spids/${encodeURIComponent(spid.toUpperCase())}`
      );
      return formatResponse(data);
    }
  );
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exits 0, no errors.

- [ ] **Step 3: Run the check harness for the full set**

Run: `node <SCRATCHPAD>/check-ref-tools.mjs 9`
Expected: lists all 9 ref_ tools ending `ref_search_spids, ref_get_spid`, then `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/tools/reference-data.ts
git commit -m "feat: reference-data SPID tools (#6)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Documentation (README + knowledge base)

**Files:**
- Modify: `README.md` (Tools table, ~line 52–64)
- Modify: `src/knowledge.ts` (Overview list ~line 29–38; Tool Groups after the CNAM block ~line 118–124; Key Concepts NNID glossary row ~line 145)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing (docs only).

- [ ] **Step 1: Add the README Tools-table row**

In `README.md`, add this row immediately after the `| Reports | \`report_\` | 3 | Async report jobs |` row:

```markdown
| Reference Data | `ref_` | 9 | CIC, NNID, Resp Org, SPID directory lookups (credentialed, read-only) |
```

- [ ] **Step 2: Add the knowledge Overview bullet**

In `src/knowledge.ts`, add this bullet to the Overview list, after the `**Port-Out Releases**` bullet:

```
- **Reference Data** — Credentialed, read-only directory lookups: NANPA CICs, NetNumber GCMR NNIDs, Somos Resp Orgs, and NPAC SPID registrations
```

- [ ] **Step 3: Add the knowledge Tool Groups block**

In `src/knowledge.ts`, add this block immediately after the CNAM tool-group block (after the `cnam_delete` line and its trailing `---`), before `## Key Concepts`:

```
### Reference Data (ref_*)
Credentialed, read-only reference directories. Requires a KYC-vetted token with
the reference-data:read operation. This surface establishes NONE of: routing,
entitlement, current toll-free ownership, or current TN SPID.

- **ref_search_cics / ref_get_cic / ref_resolve_cics** — NANPA Feature Group D
  Carrier Identification Codes; resolve accepts up to 100 CICs per call
- **ref_search_nnids / ref_get_nnid** — Published NetNumber GCMR NNID directory
  (the GLOBAL reference directory — distinct from the account-configured
  messaging NNIDs managed by msg_* tools)
- **ref_search_resp_orgs / ref_get_resp_org** — Published Somos Resp Org
  identities; detail returns full order-processing contacts
- **ref_search_spids / ref_get_spid** — Published NPAC SPID registration
  identities; search returns a contact COUNT only, detail returns the
  registration contacts for the requested SPID only. NPAC registration contacts
  are distinct from the live SPID-on-number seen via Telique/LSMS and from
  customer SPID entitlement.

---
```

- [ ] **Step 4: Fix the NNID glossary row**

In `src/knowledge.ts` Key Concepts table, replace the existing NNID row:

```
| NNID | Network Node ID — identifier for messaging routing nodes |
```

with:

```
| NNID | Network Node ID. Two distinct meanings: (1) the global NetNumber GCMR reference directory queried by ref_* tools; (2) an account-configured messaging routing node managed by msg_* tools |
```

- [ ] **Step 5: Build (confirms the knowledge string still compiles)**

Run: `npm run build`
Expected: exits 0, no errors.

- [ ] **Step 6: Verify docs mention the new group**

Run: `grep -c "ref_" README.md && grep -c "Reference Data (ref_\*)" dist/knowledge.js`
Expected: first ≥ 1, second = 1.

- [ ] **Step 7: Commit**

```bash
git add README.md src/knowledge.ts
git commit -m "docs: document reference-data tools + fix NNID glossary (#6)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Live smoke script + final verification

**Files:**
- Create: `<SCRATCHPAD>/smoke-ref-tools.mjs` (user-run; not committed)

**Interfaces:**
- Consumes: a `reference-data:read`-scoped token via `TNIQ_API_TOKEN`.
- Produces: nothing committed.

- [ ] **Step 1: Create the live smoke script**

Create `<SCRATCHPAD>/smoke-ref-tools.mjs`:

```js
// Live smoke test for the reference-data tools. Run with a KYC/NPAC-scoped
// token:  TNIQ_API_TOKEN=... node smoke-ref-tools.mjs
// Optionally override the host:  TNIQ_HOST=https://staging-api.ringer.tel
const HOST = (process.env.TNIQ_HOST || "https://api.tniq.ringer.tel").replace(/\/+$/, "");
const TOKEN = process.env.TNIQ_API_TOKEN;
if (!TOKEN) {
  console.error("Set TNIQ_API_TOKEN (a reference-data:read-scoped token).");
  process.exit(2);
}

async function call(method, path, { token = TOKEN, body } = {}) {
  const res = await fetch(HOST + path, {
    method,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

function firstId(page, key) {
  const list = page && (page.content || page);
  return Array.isArray(list) && list[0] ? list[0][key] : null;
}

const results = [];
function log(label, r) {
  const ok = r.status >= 200 && r.status < 300;
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${String(r.status).padEnd(4)} ${label}`);
}

// 1. List endpoints
const cics = await call("GET", "/v1/reference-data/cics?size=5");
log("GET /cics", cics);
const nnids = await call("GET", "/v1/reference-data/nnids?size=5");
log("GET /nnids", nnids);
const respOrgs = await call("GET", "/v1/reference-data/resp-orgs?size=5");
log("GET /resp-orgs", respOrgs);
const spids = await call("GET", "/v1/reference-data/spids?size=5");
log("GET /spids", spids);

// 2. Detail endpoints (derive one id from each list)
const cic = firstId(cics.json, "cic");
if (cic) log(`GET /cics/${cic}`, await call("GET", `/v1/reference-data/cics/${encodeURIComponent(cic)}`));
const nnid = firstId(nnids.json, "nnid");
if (nnid) log(`GET /nnids/${nnid}`, await call("GET", `/v1/reference-data/nnids/${encodeURIComponent(nnid)}`));
const respOrgId = firstId(respOrgs.json, "respOrgId");
if (respOrgId) log(`GET /resp-orgs/${respOrgId}`, await call("GET", `/v1/reference-data/resp-orgs/${encodeURIComponent(respOrgId)}`));
const spid = firstId(spids.json, "spid");
if (spid) log(`GET /spids/${spid}`, await call("GET", `/v1/reference-data/spids/${encodeURIComponent(spid)}`));

// 3. Bounded resolve
log("POST /cics/resolve", await call("POST", "/v1/reference-data/cics/resolve", { body: { cics: cic ? [cic] : ["0555"] } }));

// 4. Negative: no token must be rejected (401/403)
const noAuth = await call("GET", "/v1/reference-data/cics?size=1", { token: null });
const rejected = noAuth.status === 401 || noAuth.status === 403;
results.push(rejected);
console.log(`${rejected ? "PASS" : "FAIL"}  ${noAuth.status}  GET /cics (no token) -> expect 401/403`);

// 5. SPID contact boundary: list must NOT include contact values
const spidBoundaryOk = !JSON.stringify(spids.json || {}).match(/"contacts"\s*:/);
results.push(spidBoundaryOk);
console.log(`${spidBoundaryOk ? "PASS" : "FAIL"}  ---  SPID list omits contact values`);

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run it (user-run) with a scoped token**

Run: `TNIQ_API_TOKEN=<scoped-token> node <SCRATCHPAD>/smoke-ref-tools.mjs`
Expected: all list/detail/resolve calls PASS (2xx); the no-token call PASS (401/403); the SPID boundary check PASS. Final line `N/N passed`.

- [ ] **Step 3: Final full build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Confirm all nine tools register at runtime**

Run: `node <SCRATCHPAD>/check-ref-tools.mjs 9`
Expected: `registered 9 ref_ tools: ...` then `OK`.

- [ ] **Step 5: Review acceptance criteria against `docs/superpowers/specs/2026-07-17-reference-data-tools-design.md`**

Confirm each acceptance-criteria checkbox in the spec is satisfied. No commit needed (verification only).

---

## Notes for the PR

- Branch `feat/reference-data-tools` is stacked on `refactor/mcp-v1-path-sweep`. Decide PR base (target the refactor branch, or fold it in) before opening.
- Consider a CHANGELOG entry and version bump (e.g. 1.2.0) — confirm with the maintainer; not included as a task since release policy is CI/CD-driven.
