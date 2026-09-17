import { useRef, useState } from "react";
import { Download, Upload, RotateCcw, Palette } from "lucide-react";
import { useTheme } from "../components/ThemeProvider";
import { PRESET_THEMES } from "../vendor/openhuman/theme/presets";
import { Ghosty } from "../vendor/openhuman/mascot/Ghosty";
import {
  DEFAULT_APPEARANCE,
  appearanceVariables,
  parseThemeFile,
} from "./appearance";

export default function ThemeStudio(): React.JSX.Element {
  const { theme, setTheme, appearance, setAppearance } = useTheme();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  function exportTheme(): void {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              version: 1,
              theme: theme.startsWith("human-") ? theme : "human-dark",
              appearance,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mighty-theme.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="mighty-page theme-studio">
      <div className="mighty-page-heading">
        <div>
          <span className="mighty-eyebrow">MAKE IT YOURS</span>
          <h1>Appearance</h1>
          <p>A familiar workspace, with a little more you.</p>
        </div>
        <Palette size={26} />
      </div>
      <section className="mighty-card">
        <h2>Choose your atmosphere</h2>
        <p>OpenHuman’s five theme families, in light and dark.</p>
        <div className="mighty-theme-grid">
          {PRESET_THEMES.map((preset) => {
            const id = `human-${preset.id}`;
            const vars = appearanceVariables(id, DEFAULT_APPEARANCE);
            return (
              <button
                key={id}
                className={`mighty-theme-swatch ${theme === id ? "selected" : ""}`}
                aria-pressed={theme === id}
                onClick={() => {
                  setAppearance({
                    ...appearance,
                    accent: undefined,
                    surface: undefined,
                    chrome: undefined,
                  });
                  setTheme(id);
                }}
              >
                <span
                  className="mighty-theme-mini"
                  style={{ background: vars["--mighty-chrome"] }}
                >
                  <i style={{ background: vars["--bg-primary"] }}>
                    <b style={{ background: vars["--accent"] }} />
                  </i>
                </span>
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </section>
      <div className="mighty-two-columns">
        <section className="mighty-card">
          <h2>Fine tune</h2>
          {!theme.startsWith("human-") && (
            <p>Select a Human theme above to customize its colors.</p>
          )}
          {(
            [
              ["accent", "Accent", "#2f6ef4"],
              ["surface", "Main panel", "#171717"],
              ["chrome", "Window frame", "#0a0a0a"],
            ] as const
          ).map(([key, label, fallback]) => (
            <label className="mighty-setting-row" key={key}>
              {label}
              <input
                type="color"
                disabled={!theme.startsWith("human-")}
                aria-label={label}
                value={appearance[key] || fallback}
                onChange={(e) =>
                  setAppearance({ ...appearance, [key]: e.target.value })
                }
              />
            </label>
          ))}
          <div className="mighty-inline-actions">
            <button className="mighty-button" onClick={exportTheme}>
              <Download size={15} />
              Export
            </button>
            <button
              className="mighty-button"
              onClick={() => fileInput.current?.click()}
            >
              <Upload size={15} />
              Import
            </button>
            <button
              className="mighty-button"
              onClick={() => setAppearance(DEFAULT_APPEARANCE)}
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
          <input
            hidden
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 20000)
                  throw new Error("Theme file is too large.");
                const parsed = parseThemeFile(await file.text());
                setAppearance(parsed.appearance);
                setTheme(parsed.theme);
                setError("");
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Unable to import theme.",
                );
              }
              e.target.value = "";
            }}
          />
          {error && (
            <p role="alert" className="mighty-error">
              {error}
            </p>
          )}
        </section>
        <section className="mighty-card mighty-mascot-settings">
          <div>
            <h2>Your companion</h2>
            <p>Expressive, and connected to the current task.</p>
            <label className="mighty-setting-row">
              Color
              <input
                aria-label="Companion color"
                type="color"
                value={appearance.mascot}
                onChange={(e) =>
                  setAppearance({ ...appearance, mascot: e.target.value })
                }
              />
            </label>
            <label className="mighty-setting-row">
              Animation
              <input
                type="checkbox"
                checked={appearance.animated}
                onChange={(e) =>
                  setAppearance({ ...appearance, animated: e.target.checked })
                }
              />
            </label>
          </div>
          <Ghosty
            idPrefix="studio-preview"
            size={160}
            bodyColor={appearance.mascot}
            variant="flat"
            animated={false}
          />
        </section>
      </div>
      <p className="mighty-attribution">
        Theme palettes and companion artwork from OpenHuman · Tiny Humans.
        Adapted for Mighty.
      </p>
    </div>
  );
}
