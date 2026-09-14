# Mighty Desktop workspace

This is the single user-facing Mighty application. It replaces the older
separate Mighty Tkinter window and localhost web page. Those old interfaces
have been removed; CLI diagnostics remain in the parent `Mighty` folder.

## Use and edit

- Launch the portable build with `..\..\start-mighty.ps1` or run the built
  `dist\mighty-desktop-0.7.7-portable.exe` directly.
- Edit this folder for desktop interface, chat, sessions, model selection,
  providers, MCP tools, skills, memory, workflows, and approvals.
- Keep Windows-MCP and Blender-MCP registered through Hermes. They are native
  execution routes, not features to replace with blind mouse automation.

## Single-app rule

Mighty Desktop owns the user-visible session and tool timeline. All desktop
launchers, including the Start menu and Windows startup shortcuts, target the
same build. The parent CLI's `open` command also launches this desktop; the old
`serve` command and separate Tkinter/web interface files have been removed.

## Safety and feature boundaries

The app stays local-first. Prefer app APIs and MCP tools, require explicit
approval for external posting or consequential actions, and do not silently
record screen, camera, microphone, clipboard, or paired devices. A workflow may
become a reusable skill only after success evidence and a rollback/verification
step. See `..\..\MIGHTY_HANDOFF.md` for the full product specification.
