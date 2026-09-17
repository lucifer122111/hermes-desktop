import { findPreset, PRESET_THEMES } from "../vendor/openhuman/theme/presets";
import baseTokenCss from "../vendor/openhuman/theme/base-tokens.css?raw";

export interface AppearanceOptions {
  accent?: string;
  surface?: string;
  chrome?: string;
  mascot: string;
  animated: boolean;
}
export const DEFAULT_APPEARANCE: AppearanceOptions = {
  mascot: "#F7D145",
  animated: true,
};
export const APPEARANCE_KEY = "mighty.appearance.v1";
const HEX = /^#[0-9a-f]{6}$/i;

export function validateAppearance(value: unknown): AppearanceOptions {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Choose a Mighty theme JSON file.");
  const input = value as Record<string, unknown>;
  const result = { ...DEFAULT_APPEARANCE };
  for (const key of ["accent", "surface", "chrome", "mascot"] as const) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== "string" || !HEX.test(input[key]))
      throw new Error(`Invalid ${key} color.`);
    result[key] = input[key];
  }
  if (input.animated !== undefined && typeof input.animated !== "boolean")
    throw new Error("Invalid animation setting.");
  result.animated = input.animated === undefined ? true : input.animated;
  return result;
}

export function readAppearance(): AppearanceOptions {
  try {
    return validateAppearance(
      JSON.parse(localStorage.getItem(APPEARANCE_KEY) || "null"),
    );
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

// Read OpenHuman's canonical base palette. Presets are partial overrides of it.
function baseColors(dark: boolean): Record<string, string> {
  const readBlock = (selector: string): Record<string, string> => {
    const body = baseTokenCss.split(selector + " {")[1]?.split("}")[0] || "";
    return Object.fromEntries(
      [...body.matchAll(/--([\w-]+):\s*(\d+\s+\d+\s+\d+)\s*;/g)].map((m) => [
        m[1],
        m[2],
      ]),
    );
  };
  return { ...readBlock(":root"), ...(dark ? readBlock(":root.dark") : {}) };
}

export function appearanceVariables(
  id: string,
  options: AppearanceOptions,
): Record<string, string> {
  const preset = id.startsWith("human-") ? findPreset(id.slice(6)) : undefined;
  if (!preset) return {};
  const colors = { ...baseColors(preset.isDark), ...preset.colors };
  const rgb = (token: string) => `rgb(${colors[token] || colors.content})`;
  const accent = options.accent || rgb("primary-500");
  const surface = options.surface || rgb("surface");
  return {
    "--bg-primary": surface,
    "--bg-secondary": rgb("surface-canvas"),
    "--bg-tertiary": rgb("surface-muted"),
    "--bg-elevated": rgb("surface-strong"),
    "--bg-hover": rgb("surface-hover"),
    "--bg-active": rgb("surface-strong"),
    "--mighty-chrome": options.chrome || rgb("surface-chrome"),
    "--accent": accent,
    "--accent-hover": rgb("primary-600"),
    "--accent-text": preset.isDark ? rgb("primary-300") : rgb("primary-600"),
    "--accent-subtle": `color-mix(in srgb, ${accent} 14%, transparent)`,
    "--text-primary": rgb("content"),
    "--text-secondary": rgb("content-secondary"),
    "--text-muted": rgb("content-muted"),
    "--border": rgb("line"),
    "--border-bright": rgb("line-strong"),
    "--border-focus": accent,
    "--user-bubble": accent,
    "--user-bubble-text": rgb("content-inverted"),
    "--agent-bubble": rgb("surface-muted"),
    "--agent-bubble-text": rgb("content"),
    "--code-bg": rgb("surface-canvas"),
    "--success": rgb("sage-500"),
    "--success-bg": `rgb(${colors["sage-500"]} / .12)`,
    "--error": rgb("coral-500"),
    "--error-bg": `rgb(${colors["coral-500"]} / .12)`,
    "--warning": rgb("amber-500"),
    "--warning-bg": `rgb(${colors["amber-500"]} / .12)`,
    "--primary-yellow": "#f7d145",
    "--scrollbar-thumb": rgb("line-strong"),
    "--scrollbar-hover": rgb("content-muted"),
    "--selection": `color-mix(in srgb, ${accent} 32%, transparent)`,
    ...(preset.fonts.body ? { "--font-sans": preset.fonts.body } : {}),
  };
}

export function parseThemeFile(raw: string): {
  theme: string;
  appearance: AppearanceOptions;
} {
  if (raw.length > 20_000) throw new Error("Theme file is too large.");
  const file = JSON.parse(raw);
  if (
    file?.version !== 1 ||
    !PRESET_THEMES.some((p) => `human-${p.id}` === file.theme)
  )
    throw new Error("Unsupported Mighty theme.");
  return { theme: file.theme, appearance: validateAppearance(file.appearance) };
}
