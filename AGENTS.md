# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript MCP server published as `tniq-mcp`. Source lives in `src/`; `src/index.ts` is the CLI/MCP entrypoint, `src/client.ts` wraps TNIQ HTTP requests, and `src/config.ts` loads runtime configuration. Tool registrations are grouped by domain in `src/tools/` (`soa.ts`, `tollfree.ts`, `inventory.ts`, etc.). Shared helpers belong in `src/utils/`. MCP metadata lives in `src/annotations.ts`, `src/icons.ts`, and `src/knowledge.ts`. Build output goes to `dist/`. `tniq-api.json` is the local API reference — it is **generated**, not hand-edited: run `npm run sync-spec` to regenerate it from the live OpenAPI spec (`GET /v1/api-docs/customer`, served by the `ringer-soa` backend).

## Build, Test, and Development Commands

- `npm ci`: install dependencies exactly from `package-lock.json`.
- `npm run build`: compile TypeScript with strict settings and emit declarations to `dist/`.
- `npm run dev`: run the server entrypoint directly with `tsx`.
- `npm start`: run the compiled `dist/index.js` entrypoint.
- `npm run sync-spec`: regenerate `tniq-api.json` from the live OpenAPI spec.
- `npm run prepublishOnly`: build before publishing.

CI runs `npm ci` and `npm run build` on pushes and PRs to `main`. There is currently no dedicated test script, so the build is the required validation step.

## Coding Style & Naming Conventions

Use TypeScript ES modules with explicit `.js` import extensions for local files. Keep `strict` TypeScript clean. Follow the existing style: two-space indentation, double quotes, semicolons, camelCase variables, PascalCase classes/types, and domain-prefixed MCP tool names such as `cnam_query` or `tf_get_inventory_summary`. Validate inputs with `zod` and helpers from `src/utils/validation.ts`; format output through `formatResponse` or `errorResult`.

## Testing Guidelines

When adding tests, place them near the relevant source or under `test/` or `tests/`, with names like `client.test.ts` or `cnam.test.ts`. Cover schema validation, request construction, and error handling for new tools. Until a test runner is introduced, document manual checks in the PR and always run `npm run build`.

## Commit & Pull Request Guidelines

Commit subjects in this repo are short, imperative, and capitalized, for example `Fix README quick start to show explicit setup step` or `Bump version to 1.0.1`. Keep commits focused on one behavior or documentation change.

PRs should include a concise summary, validation performed, linked issues when applicable, and notes for API, environment variable, or MCP tool surface changes. Include screenshots only when setup or documentation visuals clarify the result.

## Security & Configuration Tips

Never commit real `TNIQ_API_TOKEN` values, `.env` files, generated tarballs, or `dist/` output. Use `tniq-mcp setup` or environment variables for local credentials, and keep defaults aligned with `README.md` and `INSTALL.md`.
