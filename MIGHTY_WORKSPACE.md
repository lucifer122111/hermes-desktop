# Mighty Desktop workspace

This is the single user-facing Mighty application. It replaces the older
separate Mighty Tkinter window and localhost web page, which remain only as
diagnostic/migration utilities in the parent `Mighty` folder.

## Use and edit

- Launch the portable build with `..\..\start-mighty.ps1` or run the built
  `dist\mighty-desktop-0.7.7-portable.exe` directly.
- Edit this folder for desktop interface, chat, sessions, model selection,
  providers, MCP tools, skills, memory, workflows, and approvals.
- Keep Windows-MCP and Blender-MCP registered through Hermes. They are native
  execution routes, not features to replace with blind mouse automation.

## Single-app rule

Mighty Desktop owns the user-visible session and tool timeline. Do not launch
the parent folder's `mighty_desktop.py` or `mighty.py serve` as a second daily
workspace: two simultaneous front ends can split session context and make task
status misleading. The parent tools are limited to diagnostics and migration.

## Safety and feature boundaries

The app stays local-first. Prefer app APIs and MCP tools, require explicit
approval for external posting or consequential actions, and do not silently
record screen, camera, microphone, clipboard, or paired devices. A workflow may
become a reusable skill only after success evidence and a rollback/verification
step. See `..\..\MIGHTY_HANDOFF.md` for the full product specification.
