# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run build` — `rimraf ./dist && tsc && npm run plugin-ui`. The `plugin-ui` step rsyncs `src/homebridge-ui/public/index.html` into `dist/` (the UI server itself is TypeScript and compiled by `tsc`). Skipping it produces a broken published package.
- `npm run lint` — ESLint over the whole repo with `--max-warnings=0`. CI fails on any warning. `npm run lint:fix` to autofix.
- `npm test` — vitest, colocated `src/**/*.test.ts` files. `npm run test:watch` and `npm run test-coverage` also available.
- `npm run watch` — build, `npm link`, then `nodemon`: recompiles and restarts `homebridge -U ./test/hbConfig -D` on `src/**/*.ts` changes. `./test/hbConfig` is gitignored; create it locally with a `config.json` containing MEATER credentials.
- `npm run docs` — typedoc into `docs/` (gitignored — generated output is never committed).
- `npm run prepublishOnly` — lint then build; runs automatically on publish.

CI (`.github/workflows/build.yml`) runs install + lint on Node 22.x/24.x. Releases publish via `.github/workflows/release.yml`: a GitHub release (tag `vX.Y.Z`) publishes to npm's `latest` tag; pushes to `beta-X.Y.Z` / `alpha-X.Y.Z` branches publish incrementing prerelease versions to the `beta` / `alpha` tags.

Supported Node: `^22.12.0 || ^24.0.0`. Homebridge: `^1.11.4 || ^2.0.0`.

## Architecture

Homebridge dynamic platform plugin (`platform: "Meater"`, package `@homebridge-plugins/homebridge-meater`) exposing MEATER smart meat thermometer probes as HomeKit temperature sensors, fed by the MEATER Cloud public REST API.

### HAP/Matter platform selection

`src/index.ts` registers a runtime proxy that picks `MeaterMatterPlatform` (`src/MeaterMatterPlatform.ts`) when Homebridge reports Matter available+enabled (config-gated), otherwise the HAP `MeaterPlatform` (`src/platform.ts`). Matter API calls must stay optional-chained.

### Authentication and discovery (`src/platform.ts`)

Logs in to `public-api.cloud.meater.com/v1/login` with the user's e-mail/password to obtain a bearer token (persisted back to the Homebridge config as `credentials.token` and reused on later startups). Device discovery then queries `/v1/devices`. HTTP calls use native Node `http`/`https` requests via the platform's `requestJson` helper (undici was deliberately removed) — responses are collected into `Buffer` chunks (import `Buffer` from `node:buffer`). Probes only appear in the cloud API during an active cook.

### Device class (`src/device/meater.ts`)

`Meater` extends `deviceBase` (`src/device/device.ts`) and is stored on the accessory as `accessory.control` (module augmentation in `device.ts`). It exposes internal and ambient temperature sensor services plus a "Cook Refresh" switch, polling on an rxjs `interval` at `deviceRefreshRate`. Probe temperatures are clamped to HomeKit's valid characteristic range before updates.

### Logging

The platform and `deviceBase` expose leveled log helpers (`infoLog`, `warnLog`, `errorLog`, `debugLog`, …) gated by `config.options.logging` with per-device overrides. Use these instead of `this.log` directly.

## Conventions

- TypeScript ESM (`"type": "module"`): relative imports use `.js` extensions even from `.ts` source.
- ESLint is `@antfu/eslint-config` (flat config in `eslint.config.js`): single quotes, 1tbs braces, `curly` multi-line only, sorted exports. Run `npm run lint:fix` before committing.
- `config.schema.json` defines the Homebridge UI form and must stay in sync with the interfaces in `src/settings.ts`.
- Copyright headers in `src/` credit @donavanbecker, the original plugin author — leave them in place.
