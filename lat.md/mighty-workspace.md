# Mighty workspace

Mighty adds OpenHuman-based appearance, a department office and a private local runtime without removing the inherited desktop features.

## Appearance and navigation

The theme studio maps vendored OpenHuman presets to existing desktop tokens. Overview, notes, focus timer and companion are additions; original chat, memory, tools, settings and task-board screens remain available.

[[src/renderer/src/mighty/ThemeStudio.tsx]] validates appearance import/export. [[src/renderer/src/mighty/workspaceState.ts]] scopes notes and goals by connection and profile. [[src/renderer/src/screens/Layout/Layout.tsx]] keeps chat mounted while other views are visible.

## Department office

Six department islands group the installed specialist roster. Preparing a workflow creates three dependent task-board stages; Explore 3D retains the original office world.

[[src/main/mighty-office.ts#createOfficeWorkflow]] creates Research, Build and Verify stages with parent IDs, preserving partial work on failure. The user reviews and runs them through Workflows. Role counts do not mean running models.

[[src/renderer/src/mighty/AgencyOffice.tsx]] displays actual task states and retains [[src/renderer/src/screens/Office/Office.tsx]] through Explore 3D. Private engine configuration serializes office workers without limiting independent user chats.

## Independent runtime

The default local home is LocalAppData/Mighty. Migration copies the working engine, settings and consistent database snapshots without removing the original Hermes installation.

`scripts/prepare-mighty-runtime.mjs` preserves credentials only in private local data, rewrites source paths and pauses copied schedules/inbound channels to prevent duplicate execution. The gateway uses port 18642; desktop transport prefers 19642.

## Verified learning

The private runtime loads learning tools and bounded new-session guidance. Saved fixes require recorded failure, correction and a separate successful check before export as reusable skills.

The learning module lives in the parent Mighty project. Evidence and lessons are private, profile-scoped SQLite data. Regressions invalidate old lessons. This reduces repeat errors; it does not guarantee correctness or train model weights.

## Regression coverage

Tests cover workflow order, partial failure, unknown specialists, profile isolation, safe theme import, live-chat retention and session model continuity.

[[src/main/mighty-office.test.ts]] and [[src/renderer/src/mighty/persistence.test.ts]] cover the new modules. Existing transport and chat-run tests remain required. Build checks cover main-process and renderer TypeScript.

The `scripts/check-mighty-ui.cjs` acceptance test launches an isolated desktop profile against the private runtime and checks rendered navigation, all roster counts, theme presets, companion and health. It closes only its own test instance.

## Packaging privacy

The package excludes private sandbox output, index caches and SQLite evidence files. Upstream license and provenance notices remain included.

Local chat databases, credentials, receipts and runtime backups belong only in the private Mighty home, never in the app archive or public Git repositories.
