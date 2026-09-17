# Mighty Artwork

Mighty uses the user's supplied artwork throughout its desktop identity, retaining the complete original composition and colors.

## Source Assets

The original square PNG is copied byte-for-byte into `resources/mighty-icon.png` and `src/renderer/src/assets/mighty-icon.png`; the user's Downloads file remains unchanged.

The supplied image is `ChatGPT Image Sep 14, 2026, 10_59_34 AM.png`. No redraw, crop, recoloring, or masking is applied. UI elements contain the full image and may round only its outer corners.

## Desktop Identity

The desktop window and application package use the same artwork so the title bar, taskbar, installer, and in-app welcome screen identify the user's Mighty app consistently.

The Electron builder configuration points to `resources/mighty-icon.png`. Its built-in converter creates platform icon formats at packaging time. [[src/main/app/start.ts#startMainProcess]] uses the Mighty Windows app identifier, and the window receives the PNG icon on Windows and Linux.

The chat welcome artwork is rendered by [[src/renderer/src/screens/Chat/ChatEmptyState.tsx#ChatEmptyState]]. It keeps the existing suggestions and chat behavior.

## Verification

Asset checks compare SHA-256 hashes against the supplied file and exercise the installed Electron builder PNG-to-ICO converter without rebuilding or starting the app.

Packaging and visual checks are completed with the surrounding desktop redesign. Semantic lat commands require the unavailable `lat` executable in the current environment.
