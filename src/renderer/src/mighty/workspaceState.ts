export interface WorkspaceGoal {
  id: string;
  text: string;
  done: boolean;
}
export interface WorkspaceState {
  goals: WorkspaceGoal[];
  journal: string;
  focusEnd: number | null;
  focusRemaining: number;
}
export const EMPTY_WORKSPACE: WorkspaceState = {
  goals: [],
  journal: "",
  focusEnd: null,
  focusRemaining: 25 * 60,
};
export function workspaceKey(connection: string, profile: string): string {
  return `mighty.workspace.v1:${JSON.stringify([connection, profile])}`;
}
export function readWorkspace(
  connection: string,
  profile: string,
): WorkspaceState {
  try {
    const value = JSON.parse(
      localStorage.getItem(workspaceKey(connection, profile)) || "null",
    );
    if (!value || typeof value !== "object")
      return { ...EMPTY_WORKSPACE, goals: [] };
    return {
      goals: Array.isArray(value.goals)
        ? value.goals
            .filter(
              (g: WorkspaceGoal) =>
                typeof g?.id === "string" &&
                typeof g.text === "string" &&
                typeof g.done === "boolean",
            )
            .slice(0, 100)
        : [],
      journal:
        typeof value.journal === "string" ? value.journal.slice(0, 30000) : "",
      focusEnd:
        Number.isFinite(value.focusEnd) && value.focusEnd > 0
          ? value.focusEnd
          : null,
      focusRemaining: Number.isFinite(value.focusRemaining)
        ? Math.max(0, Math.min(3600, value.focusRemaining))
        : 1500,
    };
  } catch {
    return { ...EMPTY_WORKSPACE, goals: [] };
  }
}
export function focusSeconds(state: WorkspaceState, now: number): number {
  return state.focusEnd === null
    ? state.focusRemaining
    : Math.max(0, Math.ceil((state.focusEnd - now) / 1000));
}
