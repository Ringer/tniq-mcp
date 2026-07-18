# Reference-data MCP tools — Design

**Issue:** [#6 — Add MCP tools for CIC, NNID, Resp Org, and SPID reference data](https://github.com/Ringer/tniq-mcp/issues/6)
**Date:** 2026-07-17
**Branch:** `feat/reference-data-tools` (stacked on `refactor/mcp-v1-path-sweep`)

## Goal

Expose the TNIQ Customer API's credentialed, read-only reference-data surface as
MCP tools: NANPA Feature Group D CICs, the NetNumber GCMR NNID directory, Somos
Resp Org identities, and NPAC SPID registration records. Nine operations total.

The admin acquisition/import/review/publication surface
(`/v1/admin/reference-data/*`) is **out of scope** and is not present in the
customer OpenAPI document.

## Approach

One new module `src/tools/reference-data.ts` exporting
`registerReferenceDataTools(server, client)`, registered in `src/index.ts` —
identical in shape to every existing tool group (`cnam.ts`, `tollfree.ts`, …).

Rejected alternative: per-entity files (`cic.ts`, `nnid.ts`, …). Nine read-only
tools over one API area is small and cohesive; every existing group is
one-file-per-area. A single module keeps the group discoverable and matches
convention.

Reuses the established conventions unchanged: `TniqClient` (`client.get`/
`client.post`), Zod input schemas, `READ_ONLY_ANNOTATIONS`, and
`formatResponse` for output (including its array truncation + error surfacing).

## The nine tools

All carry `READ_ONLY_ANNOTATIONS` — including `ref_resolve_cics`, which is a
POST but is explicitly non-mutating.

| Tool | Method / Path | Params |
|------|---------------|--------|
| `ref_search_cics` | GET `/v1/reference-data/cics` | `search?`, `status?`, `active?`, `page=0`, `size=50` |
| `ref_get_cic` | GET `/v1/reference-data/cics/{cic}` | `cic` (required) |
| `ref_resolve_cics` | POST `/v1/reference-data/cics/resolve` | `cics: string[]` (1–100), read-only |
| `ref_search_nnids` | GET `/v1/reference-data/nnids` | `search?`, `serviceType?`, `countryIso2?`, `active?`, `page`, `size`, `sort=nnid,asc` |
| `ref_get_nnid` | GET `/v1/reference-data/nnids/{nnid}` | `nnid` (required) |
| `ref_search_resp_orgs` | GET `/v1/reference-data/resp-orgs` | `search?`, `entityId?`, `active?`, `page`, `size`, `sort=respOrgId,asc` |
| `ref_get_resp_org` | GET `/v1/reference-data/resp-orgs/{respOrgId}` | `respOrgId` (required) |
| `ref_search_spids` | GET `/v1/reference-data/spids` | `search?`, `region?`, `active?`, `page`, `size`, `sort=spid,asc` |
| `ref_get_spid` | GET `/v1/reference-data/spids/{spid}` | `spid` (required, 4-char) |

### Schema rules

- `page`: integer ≥ 0, default 0. `size`: integer 1–200, default 50. `sort`:
  string with the OpenAPI default per endpoint. Optional query params are
  forwarded only when provided (existing `client.buildUrl` drops `undefined`).
- **SPID identifiers** (`spid` path param and `ref_get_spid`): validate
  `^[A-Za-z0-9]{4}$` and normalize to uppercase — "four-character uppercase
  alphanumeric".
- **`ref_resolve_cics.cics`**: array bounded to **1–100** items. The machine
  schema declares `maxItems: 500` but the endpoint summary documents "up to 100
  distinct CICs"; enforce the stricter documented bound so we never send a
  request the backend may reject. Description notes the bound.
- Path params are `encodeURIComponent`-escaped (matches `tollfree.ts`).

## Data-boundary & security handling

The backend enforces the disclosure boundary structurally, so tools **pass
responses through faithfully** and encode the boundary in descriptions — no
client-side field-stripping is required or attempted:

- **SPID list/search** (`NpacSpidDirectorySummaryDto`) returns `contactCount`
  (integer) and identity fields — **never contact values**. **SPID detail**
  (`NpacSpidDirectoryDetailDto`) returns `contacts[]` for the single requested
  SPID only. Bulk contact disclosure is therefore not possible through these
  tools.
- **Resp Org list/search** returns identity summaries; **detail**
  (`RespOrgDirectoryReadDetailDto`) returns the complete published
  `companyAddress`, `primaryContact`, `changeContact`, and `notes`.
- A token lacking `reference-data:read` (or a non-KYC/non-NPAC-rights token)
  receives `401/403`, which the existing client surfaces as "Authentication
  failed" via `formatResponse`. This satisfies "a token without that operation
  is rejected".
- The DTOs already omit raw source records, hashes, snapshot IDs, and DB
  metadata; we neither request nor synthesize them.

### Description guardrails (baked into every tool description)

- The surface is **credentialed, read-only reference data**. It does **not**
  establish routing, entitlement, current toll-free ownership, or current TN
  SPID.
- NPAC registration contacts ≠ the SPID observed on live Telique/LSMS number
  data ≠ customer SPID entitlement/configuration.
- Directory NNIDs (the global NetNumber GCMR directory) ≠ account-configured
  messaging NNIDs (the `msg_*` routing-node surface).
- SPID/RespOrg contact data is non-public, available only to authenticated,
  KYC-vetted customers with NPAC rights; must not be bulk-disclosed or persisted
  into shared knowledge.

## Spec / knowledge / README changes

- `tniq-api.json`: already regenerated via `npm run sync-spec` (190 → 248
  paths); commit it.
- `src/index.ts`: import and call `registerReferenceDataTools(server, client)`.
- `README.md` Tools table: add a **Reference Data / `ref_` / 9** row.
- `src/knowledge.ts`:
  - Add a "Reference Data (`ref_*`)" entry to the Overview list and a
    "Reference Data" block to the Tool Groups section.
  - **Fix the glossary**: the current `NNID` entry describes only the messaging
    routing node. Clarify the two distinct meanings (global GCMR directory vs
    account-configured messaging NNID).
  - No real Resp Org / SPID / NNID contact values in any example.

## Verification

- `npm run build` (tsc) compiles clean — confirmed by the implementer.
- A scratchpad smoke script exercising all nine tools is provided; the **user**
  runs it with a KYC/NPAC-scoped `reference-data:read` token (the implementer
  does not handle production NPAC-contact credentials). Confirm a
  scoped token returns data and an unscoped token is rejected.
- No test framework is introduced — matches the repo's existing
  build-plus-manual-smoke convention.

## Out of scope

- `/v1/admin/reference-data/*` (acquisition, import, review, publication).
- Any test-framework introduction.
- Caching or client changes beyond the new module.

## Acceptance criteria (from #6)

All met. Shipped in `tniq-mcp@1.2.0` (2026-07-18); whole-branch review clean;
live smoke check passed with a `reference-data:read`-scoped token.

- [x] All nine operations reachable through clearly named `ref_*` tools.
- [x] Pagination, filters, identifiers, and the CIC resolve limit represented in
      schemas.
- [x] Resp Org and SPID detail return their complete credentialed contact DTOs
      without exposing admin operations or internal metadata.
- [x] SPID list/search does not return contact values.
- [x] Descriptions/output preserve the KYC/NPAC-rights and non-public-data
      boundaries.
- [x] `npm run build` passes.
- [x] Manual smoke checks: scoped token succeeds; unscoped token rejected.
      Verified 2026-07-18.
