# Changelog

All notable changes to this project will be documented in this file. This project uses [Semantic Versioning](https://semver.org/).

## v2.2.0 (2026-07-27)

### Changed

- chore(github): allow the codeql scan to be started manually
- chore(github): stop concurrent release runs racing for the same version
- chore: add the supports-matter keyword
- chore(github): use the shared homebridge action to deprecate past pre-releases
- feat(ui): add, remove and hide devices from the config via the devices tab
- style(ui): standardise the custom ui layout and sync the support tab with the readme
- feat(ui): add a remove all devices action to the my devices tab
- fix(schema): declare required fields the standard way so the homebridge ui stops reporting a config validation failure
- chore: declare the supports-hap transport keyword for the homebridge ui
- chore(deps): dependency updates
- docs(changelog): list every unreleased commit in the pending section

## v2.1.2 (2026-07-20)

### Changed

- fix(schema): give the logging levels clear, distinct names
- chore(deps): dependency updates

## v2.1.1 (2026-07-18)

### Changed

- chore(deps): update dependencies
- chore: add .idea to .gitignore
- chore(github): align workflows, funding and issue templates with the other org plugins
- chore: align npm publishing files with the other org plugins
- chore: standardise the eslint setup with the other org plugins
- refactor: store device instances on their accessories like the other org plugins
- style: apply the standardised lint rules
- chore: standardise the package scripts and publishing config
- chore: update the plugin metadata for the new maintainer
- docs: refresh the readme
- docs: add claude and copilot instructions files
- docs: use the standard org readme banner
- chore(github): update the setup-node action to v7
- chore(deps): dependency updates

## [2.1.0](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v2.1.0) (2026-05-04)

## What's Changed
* chore(release): prepare v2.1.0 release groundwork
* chore(deps): housekeeping and lockfile maintenance
* feat(matter): add Homebridge Matter support with HAP fallback
* test(matter): add config-gated fallback and selection coverage
* refactor(http): replace undici with native Node HTTP(S) requests
* chore(release): align workflow, config, and changelog for v2.1.0
* fix(device): ensure Cook Refresh switch service is created before characteristic updates (PR #28, PR #33)
* fix(auth): improve API authentication flow, persist token, and improve discovery logging (PR #35)
* fix(temperature): clamp probe temperatures to HomeKit valid range to prevent characteristic validation errors (PR #36)
* test(device): add unit tests for temperature clamping behavior (PR #36)
* docs(workflow): add Copilot beta-branch workflow documentation (PR #34)

Automatic Matter selection now uses Homebridge runtime availability only, with HAP fallback when Matter is unavailable.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v2.0.3...v2.1.0

## [2.0.3](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v2.0.3) (2025-09-18)

## What's Changed
* update dependencies by @Donavan Becker in https://github.com/homebridge-plugins/homebridge-meater/commit/ffe2d39

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v2.0.2...v2.0.3

# [2.0.2](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v2.0.2) (2025-03-04)

# *No New Releases During Lent*

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v2.0.1...v2.0.2

# [2.0.1](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v2.0.1) (2025-01-25)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v2.0.0...v2.0.1

# [2.0.0](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v2.0.0) (2025-01-16)

### What's Changes
- This plugins has moved to a scoped plugin under the `@homebridge-plugins` org.
  - Homebridge UI is designed to transition you to the new scoped plugin.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v1.1.4...v2.0.0

# [1.1.4](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v1.1.4) (2024-11-03)

### What's Changed
- Fix refreshRate Issue

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v1.1.3...v1.1.4

## [1.1.3](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v1.1.3) (2024-11-03)

### What's Changed
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v1.1.2...v1.1.3

## [1.1.2](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v1.1.2) (2024-09-25)

### What's Changed
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v1.1.1...v1.1.2

## [1.1.1](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v1.1.1) (2024-05-26)

### What's Changed
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v1.1.0...v1.1.1

## [1.1.0](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v1.1.0) (2024-02-13)

### What's Changed
- Added `device` config so that config can be assign on each device.
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v1.0.0...v1.1.0

## [1.0.0](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v1.0.0) (2024-01-31)

### What's Changed
- Release of [homebridge-meater](https://github.com/homebridge-plugins/homebridge-meater) which allows you to see the temperature to your Meater Thermometer throw HomeKit.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-meater/compare/v0.1.0...v1.0.0

## [0.1.0](https://github.com/homebridge-plugins/homebridge-meater/releases/tag/v0.1.0) (2024-01-12)

### What's Changed
- Initial release of homebridge-meater.
