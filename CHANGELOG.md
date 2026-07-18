# Changelog

All notable changes to `tniq-mcp` are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [1.2.0]

### Added
- **Reference-data tools (`ref_*`)** — nine credentialed, read-only directory
  lookups over the TNIQ Customer API (issue #6):
  - CIC (NANPA Feature Group D): `ref_search_cics`, `ref_get_cic`, and
    `ref_resolve_cics` (bounded, non-mutating resolve of up to 100 CICs).
  - NNID (published NetNumber GCMR directory): `ref_search_nnids`,
    `ref_get_nnid` — the global reference directory, distinct from the
    account-configured messaging NNIDs managed by the `msg_*` tools.
  - Resp Org (published Somos identities): `ref_search_resp_orgs`,
    `ref_get_resp_org` — detail returns the full published order-processing
    contacts.
  - SPID (published NPAC registration): `ref_search_spids`, `ref_get_spid`.
    Search returns identity summaries and a contact count only; detail returns
    the registration contacts for the requested SPID. Credentialed —
    KYC-vetted, NPAC-rights accounts only.
- Regenerated `tniq-api.json` from the live OpenAPI spec (190 → 248 endpoints).

### Changed
- Canonicalized API paths `/api/v1/*` → `/v1/*` to match the TNIQ backend (#5).

## [1.1.1]

### Changed
- Homepage / website links (`package.json`, plugin manifest, README, MCP server
  `websiteUrl`, setup wizard) now point to the TNIQ docs site
  `https://tniq.ringer.tel/docs`.

## [1.1.0]

### Added
- **New MCP tools** covering previously unsupported API surface:
  - Toll-free PTR operations (`tf_list_ptr_operations`, `tf_get_ptr_operation`,
    `tf_retry_ptr_operation`) and sync diff/commit/reject
    (`tf_get_sync_diff`, `tf_commit_sync`, `tf_reject_sync`).
  - Inventory state changes: `inv_disconnect_number`, `inv_disconnect_by_id`,
    `inv_set_pin`, `inv_set_quarantine`, `inv_clear_quarantine`.
  - New **Port Protection** group (`port_protect_*`) — list/create/get/update/delete
    port-out protection rules and resolve effective rules for a TN.
  - New **Reports** group (`report_*`) — create, list, and fetch async report jobs.
  - Messaging brand vetting, appeals, and CNP register/migration tools
    (`msg_request_vetting`, `msg_import_vetting`, `msg_appeal_vetting`,
    `msg_appeal_brand`, `msg_revet_brand`, `msg_brand_cnp_register`,
    `msg_campaign_cnp_register`, `msg_*_cnp_migration`, `msg_cnp_backfill`, and
    vetting/appeal-category lookups).
- `npm run sync-spec` regenerates `tniq-api.json` from the live OpenAPI spec
  (`GET /v1/api-docs/customer`) so the local reference no longer drifts.
- `client` now supports query params on `post`/`put` and adds a `patch` method.
- `package.json` gains `homepage`, `bugs`, and `engines` (`node >=18`) fields.

### Fixed
- **Restored the entire toll-free module.** ~30 `tf_*` tools were silently
  failing because the required `customerId` (and, for template lock/unlock/
  disconnect/delete, `effDtTm`/`recVersionId`) query parameters were never sent,
  producing HTTP 400/500 on every call. All now pass their required parameters.
- Removed three dead inventory tools (`inv_get_portable`, `inv_mark_portable`,
  `inv_clear_portable`) whose endpoints no longer exist in the API (404).
- Regenerated `tniq-api.json` (158 → 190 endpoints), correcting stale server
  hosts and adding 32 endpoints absent from the previous snapshot.

## [1.0.5]

### Changed
- Default API URL now points at the TNIQ host `https://api.tniq.ringer.tel/v1`
  (was `https://soa-api.ringer.tel`; `tniq-api.ringer.tel` remains a working alias).
- New env var `TNIQ_API_URL`. `TNIQ_API_BASE_URL` is still accepted as a fallback
  for older configs. **Migration:** if you pinned `TNIQ_API_BASE_URL` to the old
  `soa-api.ringer.tel` host, that override still wins — remove it or switch to
  `TNIQ_API_URL=https://api.tniq.ringer.tel/v1` to use the new default.

## [1.0.4]

### Fixed
- `tf_get_inventory_summary` now requires a `customerId` (UUID) parameter.
  Previously it declared no parameters and returned HTTP 500 on every call. (#1)

## [1.0.3]

### Docs
- Quick start now shows the explicit `tniq-mcp setup` step.

## [1.0.2]

### Docs
- README recommends global install (`npm install -g tniq-mcp`).

## [1.0.1]

### Changed
- `tniq-mcp setup` registers MCP clients with the global `tniq-mcp` binary when
  available instead of `npx -y tniq-mcp`.

### Build
- npm publish via CI using `NPM_TOKEN` + `--provenance` attestation.

## [1.0.0]

- Initial release — TNIQ MCP server.
