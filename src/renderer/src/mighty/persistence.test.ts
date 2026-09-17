import { beforeEach, describe, expect, it } from "vitest";
import { readWorkspace, workspaceKey, focusSeconds } from "./workspaceState";
import { parseThemeFile } from "./appearance";
describe("Mighty saved workspace", () => {
  beforeEach(() => localStorage.clear());
  it("keeps notes and focus deadlines separate across profiles and connections", () => {
    localStorage.setItem(
      workspaceKey("pc", "art"),
      JSON.stringify({ journal: "Art only", focusEnd: 8000 }),
    );
    expect(readWorkspace("pc", "art").journal).toBe("Art only");
    expect(readWorkspace("pc", "coding").journal).toBe("");
    expect(readWorkspace("phone", "art").journal).toBe("");
    expect(focusSeconds(readWorkspace("pc", "art"), 5000)).toBe(3);
    expect(focusSeconds(readWorkspace("pc", "art"), 12000)).toBe(0);
  });
  it("rejects theme imports containing arbitrary style values", () => {
    expect(() =>
      parseThemeFile(
        JSON.stringify({
          version: 1,
          theme: "human-dark",
          appearance: { accent: "url(https://example.com)" },
        }),
      ),
    ).toThrow();
  });
});
