import { readFileSync } from "fs";
import { join } from "path";
import { HERMES_HOME } from "./installer";
import { createOfficeStage } from "./kanban";
export interface OfficeSpecialist {
  slug: string;
  name: string;
  division: string;
  description: string;
}
export function officeRoster(): OfficeSpecialist[] {
  const items = JSON.parse(
    readFileSync(
      join(
        HERMES_HOME,
        "plugins",
        "agency-agents-router",
        "data",
        "agents.json",
      ),
      "utf8",
    ),
  );
  if (!Array.isArray(items)) throw new Error("Agency roster is invalid");
  return items.map(({ slug, name, division, description }) => ({
    slug,
    name,
    division,
    description,
  }));
}
const creating = new Set<string>();
export async function createOfficeWorkflow(
  task: string,
  specialist: string,
  profile = "default",
) {
  const ids: string[] = [];
  if (
    typeof task !== "string" ||
    !task.trim() ||
    task.length > 6000 ||
    typeof specialist !== "string"
  )
    return {
      success: false,
      error: "Enter a task and choose a specialist",
      ids,
    };
  if (!/^[\w.-]+$/.test(profile))
    return { success: false, error: "Invalid profile", ids };
  if (creating.has(profile))
    return {
      success: false,
      error: "A workflow is being prepared for this profile",
      ids,
    };
  creating.add(profile);
  try {
    const roster = officeRoster();
    const worker = roster.find((a) => a.slug === specialist);
    const researcher =
      roster.find((a) => a.name === "Research Synthesist") ||
      roster.find((a) => a.division === "research");
    const reviewer =
      roster.find((a) => a.name === "Reality Checker") ||
      roster.find((a) => a.division === "testing");
    if (!worker || !researcher || !reviewer)
      throw new Error("Required office specialists are unavailable");
    const stages = [
      { label: "Research", agent: researcher },
      { label: "Build", agent: worker },
      { label: "Verify", agent: reviewer },
    ];
    for (const stage of stages) {
      const previous = ids.at(-1);
      const body = `Mighty office specialist: ${stage.agent.slug}\nStage: ${stage.label}\nTask: ${task.trim()}\n\nUse agency_agents_load with agent ${stage.agent.slug} for this stage. Work as this specialist in the current worker; do not spawn other agents. ${previous ? `Read parent task ${previous}, its result and comments before starting. Reuse its verified outputs; report a blocked dependency if evidence is missing.` : "Research first and gather source references and acceptance criteria."}\nSearch mighty_learning_search before acting. Finish only this stage. Save file paths, evidence, limitations and a clear handoff in the task result. Never claim success without checking the output. External posting requires the user's explicit confirmation.`;
      const result = await createOfficeStage(
        `${stage.label} · ${task.trim().slice(0, 90)}`,
        body,
        previous,
        profile,
      );
      if (!result.success || !result.data)
        throw new Error(result.error || "Could not create stage");
      ids.push(result.data.id);
    }
    return { success: true, ids };
  } catch (error) {
    return {
      success: false,
      ids,
      error: `${error instanceof Error ? error.message : String(error)}${ids.length ? ". Created stages are preserved in Workflows; inspect them before retrying." : ""}`,
    };
  } finally {
    creating.delete(profile);
  }
}
