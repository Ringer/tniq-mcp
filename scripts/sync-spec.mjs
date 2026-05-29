#!/usr/bin/env node
// Regenerate tniq-api.json from the live TNIQ Customer API OpenAPI spec.
//
// The spec is served by the ringer-soa backend via Springdoc at
// /v1/api-docs/customer. This file is the local API reference for the MCP
// tools — keep it in sync by running `npm run sync-spec` (do not hand-edit).
//
// Override the source with an arg or env var, e.g.:
//   node scripts/sync-spec.mjs https://staging-api.ringer.tel
//   TNIQ_SPEC_URL=http://localhost:8080 node scripts/sync-spec.mjs

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE = "https://api.tniq.ringer.tel";
const SPEC_PATH = "/v1/api-docs/customer";
const OUT_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "tniq-api.json");

const base = (process.argv[2] || process.env.TNIQ_SPEC_URL || DEFAULT_BASE).replace(/\/$/, "");
const url = base + SPEC_PATH;

console.log(`Fetching OpenAPI spec from ${url} ...`);

const res = await fetch(url, { headers: { Accept: "application/json" } });
if (!res.ok) {
  console.error(`  ✗ HTTP ${res.status} ${res.statusText}`);
  process.exit(1);
}

const spec = await res.json();
const pathCount = Object.keys(spec.paths || {}).length;
if (!spec.openapi || pathCount === 0) {
  console.error("  ✗ Response is not a valid OpenAPI document (no openapi/paths).");
  process.exit(1);
}

writeFileSync(OUT_FILE, JSON.stringify(spec, null, 2) + "\n");

console.log(`  ✓ Wrote ${OUT_FILE}`);
console.log(`    title:    ${spec.info?.title}`);
console.log(`    version:  ${spec.info?.version}`);
console.log(`    paths:    ${pathCount}`);
console.log(`    servers:  ${(spec.servers || []).map((s) => s.url).join(", ")}`);
