# Copilot instructions

Guidance for AI coding agents working in this repository. The fuller version of this document is [CLAUDE.md](../CLAUDE.md) at the repo root — keep the two in sync.

## Commands

- Build: `npm run build` (`rimraf ./dist` → `tsc` → copy plugin UI html). All steps are required for a working package.
- Lint: `npm run lint` (`eslint . --max-warnings=0`, CI fails on warnings); `npm run lint:fix` to autofix.
- Test: `npm test` (vitest, colocated `src/**/*.test.ts`).
- Local dev loop: `npm run watch` (rebuild + restart `homebridge -U ./test/hbConfig -D` on changes; `./test/hbConfig` is gitignored, create locally).

## Key architecture facts

- Homebridge dynamic platform plugin exposing MEATER thermometer probes as HomeKit temperature sensors via the MEATER Cloud public REST API; probes only appear during an active cook.
- `src/index.ts` registers a runtime HAP/Matter proxy; keep `api.matter?.…` calls optional-chained.
- Auth: e-mail/password login obtains a bearer token, persisted to the Homebridge config (`credentials.token`) and reused.
- HTTP uses native Node `http`/`https` via the platform's `requestJson` helper (undici was deliberately removed); import `Buffer` from `node:buffer`.
- `Meater` (`src/device/meater.ts`) extends `deviceBase` and is stored as `accessory.control`; probe temperatures are clamped to HomeKit's valid range before characteristic updates.
- Use the platform's leveled log helpers (`infoLog`, `debugLog`, …) so user logging settings are respected.

## Conventions

- TypeScript ESM: relative imports need `.js` extensions.
- ESLint `@antfu/eslint-config`: single quotes, sorted exports; run `npm run lint:fix` before committing.
- `config.schema.json` must stay in sync with the config interfaces in `src/settings.ts`.
- Copyright headers in `src/` credit @donavanbecker (original author) — leave them in place.
