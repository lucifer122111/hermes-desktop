import { beforeEach, describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("./installer", () => ({ HERMES_HOME: "/mighty-test" }));
vi.mock("./kanban", () => ({ createOfficeStage: fake.create }));
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  const readFileSync = () =>
    JSON.stringify([
      {
        slug: "research-synthesist",
        name: "Research Synthesist",
        division: "research",
      },
      { slug: "developer", name: "Developer", division: "engineering" },
      { slug: "reality-checker", name: "Reality Checker", division: "testing" },
    ]);
  return { ...actual, readFileSync, default: { ...actual, readFileSync } };
});
import { createOfficeWorkflow } from "./mighty-office";
describe("Mighty office handoffs", () => {
  beforeEach(() => fake.create.mockReset());
  it("creates ordered dependencies scoped to the selected profile", async () => {
    fake.create
      .mockResolvedValueOnce({ success: true, data: { id: "research" } })
      .mockResolvedValueOnce({ success: true, data: { id: "build" } })
      .mockResolvedValueOnce({ success: true, data: { id: "verify" } });
    expect(
      (await createOfficeWorkflow("Make a model", "developer", "art")).ids,
    ).toEqual(["research", "build", "verify"]);
    expect(fake.create.mock.calls.map((c) => c[2])).toEqual([
      undefined,
      "research",
      "build",
    ]);
    expect(fake.create.mock.calls.every((c) => c[3] === "art")).toBe(true);
    expect(fake.create.mock.calls[1][1]).toContain("Read parent task research");
  });
  it("stops after a failed stage and returns preserved IDs", async () => {
    fake.create
      .mockResolvedValueOnce({ success: true, data: { id: "research" } })
      .mockResolvedValueOnce({ success: false, error: "Board unavailable" });
    const result = await createOfficeWorkflow("Make a model", "developer");
    expect(result.success).toBe(false);
    expect(result.ids).toEqual(["research"]);
    expect(fake.create).toHaveBeenCalledTimes(2);
  });
  it("rejects unknown specialists before creating work", async () => {
    expect(
      (await createOfficeWorkflow("Make a model", "invented")).success,
    ).toBe(false);
    expect(fake.create).not.toHaveBeenCalled();
  });
});
