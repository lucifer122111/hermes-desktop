import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Building2, RefreshCw, Search, Users } from "lucide-react";
import Office from "../screens/Office/Office";
type Specialist = Awaited<
  ReturnType<Window["hermesAPI"]["mightyOfficeRoster"]>
>[number];
type Task = NonNullable<
  Awaited<ReturnType<Window["hermesAPI"]["kanbanListTasks"]>>["data"]
>[number];
const TEAMS = [
  {
    name: "Research",
    color: "#63d9bc",
    divisions: ["research", "academic", "product"],
    x: 375,
    y: 140,
  },
  {
    name: "Engineering",
    color: "#6c9bff",
    divisions: [
      "engineering",
      "security",
      "game-development",
      "spatial-computing",
      "gis",
    ],
    x: 655,
    y: 235,
  },
  { name: "Design", color: "#cda2ff", divisions: ["design"], x: 665, y: 455 },
  {
    name: "Marketing",
    color: "#fa95b8",
    divisions: ["marketing", "paid-media", "sales"],
    x: 380,
    y: 560,
  },
  {
    name: "Operations",
    color: "#e6b666",
    divisions: [
      "project-management",
      "specialized",
      "support",
      "healthcare",
      "testing",
    ],
    x: 105,
    y: 455,
  },
  { name: "Finance", color: "#9ed673", divisions: ["finance"], x: 105, y: 235 },
];
function Desk({
  x,
  y,
  color,
}: {
  x: number;
  y: number;
  color: string;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-19 3 L0 -8 L21 3 L0 14Z" fill="#d9d4ce" />
      <path d="M-19 3v12l19 11V14Z" fill="#6e7189" />
      <path d="M0 14l21-11v12L0 26Z" fill="#8a8da3" />
      <path
        d="M-9-10L6-4v12L-9 2Z"
        fill="#1e253e"
        stroke="#bbc7e2"
        strokeWidth="2"
      />
      <ellipse cy="22" rx="9" ry="5" fill="#080f28" />
      <path d="M-5 18v-7q5-8 10 0v7" fill={color} />
      <circle cy="5" r="5" fill={color} />
    </g>
  );
}
export default function AgencyOffice({
  profile,
  visible,
  onWorkflows,
}: {
  profile: string;
  visible: boolean;
  onWorkflows: () => void;
}): React.JSX.Element {
  const [mode, setMode] = useState<"departments" | "world">("departments");
  const [roster, setRoster] = useState<Specialist[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState(0);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    const [agents, board] = await Promise.allSettled([
      window.hermesAPI.mightyOfficeRoster(),
      window.hermesAPI.kanbanListTasks({ profile }),
    ]);
    const errors: string[] = [];
    if (agents.status === "fulfilled") setRoster(agents.value);
    else
      errors.push(
        "Agency roster is unavailable. Check the local engine installation.",
      );
    if (board.status === "fulfilled" && board.value.success)
      setTasks(board.value.data || []);
    else errors.push("Task status is unavailable.");
    setError(errors.join(" "));
  }, [profile]);
  useEffect(() => {
    if (!visible) return;
    void refresh();
    const id = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 15000);
    return () => clearInterval(id);
  }, [visible, refresh]);
  const members = roster.filter(
    (a) =>
      TEAMS[team].divisions.includes(a.division) &&
      (!query ||
        `${a.name} ${a.description}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const worker = roster.find((a) => a.slug === selected);
  const officeTasks = tasks.filter(
    (t) =>
      t.body?.includes("Mighty office specialist:") && t.status !== "archived",
  );
  const current = officeTasks.filter((t) => t.status === "running");
  async function prepare() {
    if (!task.trim() || !worker) return;
    setBusy(true);
    setNotice("");
    try {
      const result = await window.hermesAPI.mightyOfficeCreateWorkflow(
        task,
        worker.slug,
        profile,
      );
      if (!result.success) throw Error(result.error);
      setNotice(
        `Three linked stages prepared: ${result.ids.join(" → ")}. Open Workflows to review and run the queue.`,
      );
      setTask("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="agency-office">
      <header className="agency-office-header">
        <div>
          <small>YOUR TEAM, YOUR WORKSPACE</small>
          <h1>
            Agents Office <span>{roster.length} specialists</span>
          </h1>
        </div>
        <div className="agency-office-actions">
          <button
            className={mode === "departments" ? "selected" : ""}
            onClick={() => setMode("departments")}
          >
            Departments
          </button>
          <button
            className={mode === "world" ? "selected" : ""}
            onClick={() => setMode("world")}
          >
            Explore 3D
          </button>
          <button onClick={() => void refresh()} aria-label="Refresh office">
            <RefreshCw size={15} />
          </button>
        </div>
      </header>
      {mode === "world" ? (
        <Office profile={profile} visible={visible} />
      ) : (
        <div className="agency-office-body">
          <div className="agency-floor">
            <div className="agency-floor-legend">
              <span className="agency-live-dot" /> {current.length} working{" "}
              <span>•</span> One stage at a time
            </div>
            <svg
              viewBox="-50 20 900 660"
              role="img"
              aria-label="Six department areas around the Mighty office hub"
            >
              <defs>
                <pattern
                  id="officeGrid"
                  width="55"
                  height="32"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M0 16L27.5 0L55 16L27.5 32Z"
                    fill="none"
                    stroke="#7988b817"
                  />
                </pattern>
              </defs>
              <rect
                x="-50"
                y="20"
                width="900"
                height="660"
                fill="url(#officeGrid)"
              />
              {TEAMS.map((t) => (
                <path
                  key={t.name}
                  d={`M380 353Q${t.x} 353 ${t.x} ${t.y}`}
                  fill="none"
                  stroke={t.color}
                  strokeOpacity=".38"
                  strokeDasharray="4 7"
                />
              ))}
              <g transform="translate(380 353)">
                <path
                  d="M-75 0L0-40L75 0L0 40Z"
                  fill="#192840"
                  stroke="#667cac"
                />
                <text
                  textAnchor="middle"
                  y="-3"
                  fill="#f0e4c5"
                  fontSize="18"
                  fontWeight="700"
                >
                  MIGHTY
                </text>
                <text textAnchor="middle" y="16" fill="#b5c3df" fontSize="10">
                  RESEARCH → BUILD → VERIFY
                </text>
              </g>
              {TEAMS.map((t, i) => {
                const count = roster.filter((a) =>
                  t.divisions.includes(a.division),
                ).length;
                return (
                  <g
                    key={t.name}
                    transform={`translate(${t.x} ${t.y})`}
                    className="agency-room"
                    role="button"
                    tabIndex={0}
                    aria-label={`${t.name}, ${count} specialists`}
                    onClick={() => {
                      setTeam(i);
                      setSelected("");
                      setQuery("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setTeam(i);
                        setSelected("");
                        setQuery("");
                      }
                    }}
                  >
                    <path
                      d="M-105 5L0-52L105 5L0 62Z"
                      fill={t.color}
                      fillOpacity={i === team ? ".5" : ".22"}
                      stroke={t.color}
                      strokeWidth={i === team ? 2 : 1}
                    />
                    <path
                      d="M-105 5v16L0 78V62Z"
                      fill={t.color}
                      fillOpacity=".18"
                    />
                    <path
                      d="M0 62L105 5v16L0 78Z"
                      fill={t.color}
                      fillOpacity=".3"
                    />
                    {[
                      [-45, -2],
                      [0, -25],
                      [42, -2],
                      [0, 22],
                    ].map(([x, y], j) => (
                      <Desk key={j} x={x} y={y} color={t.color} />
                    ))}
                    <rect
                      x="-80"
                      y="-111"
                      width="160"
                      height="46"
                      rx="8"
                      fill="#172033"
                      stroke={t.color}
                      strokeOpacity=".7"
                    />
                    <text
                      x="0"
                      y="-91"
                      textAnchor="middle"
                      fill="#f6f7fb"
                      fontSize="15"
                      fontWeight="600"
                    >
                      {t.name}
                    </text>
                    <text
                      x="0"
                      y="-75"
                      textAnchor="middle"
                      fill={t.color}
                      fontSize="11"
                    >
                      {count} specialists
                    </text>
                  </g>
                );
              })}
            </svg>
            <footer>
              Department desks represent specialist roles. Working status comes
              from the task board.
            </footer>
          </div>
          <aside className="agency-operations">
            <h2>
              <Users size={17} /> {TEAMS[team].name}
            </h2>
            <label className="agency-search">
              <Search size={14} />
              <input
                placeholder="Find a specialist"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Office specialist"
              size={5}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {members.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
            <p className="agency-specialist-description">
              {worker?.description ||
                "Choose a specialist to prepare a research, implementation and review workflow."}
            </p>
            <textarea
              aria-label="Office task"
              value={task}
              maxLength={6000}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What should the office accomplish?"
            />
            <button
              className="btn btn-primary"
              disabled={busy || !worker || !task.trim()}
              onClick={() => void prepare()}
            >
              {busy ? "Preparing…" : "Prepare workflow"}
              <ArrowRight size={15} />
            </button>
            {error && (
              <p role="alert" className="agency-error">
                {error}
              </p>
            )}
            {notice && <p role="status">{notice}</p>}
            <div className="agency-task-heading">
              <h2>Live task status</h2>
              <button onClick={onWorkflows} title="Open Workflows">
                <Building2 size={16} />
              </button>
            </div>
            <div className="agency-task-list">
              {officeTasks.length ? (
                officeTasks.slice(0, 15).map((t) => (
                  <button key={t.id} onClick={onWorkflows}>
                    <span className={`agency-task-state state-${t.status}`}>
                      {t.status}
                    </span>
                    <strong>{t.title}</strong>
                    <small>{t.id}</small>
                  </button>
                ))
              ) : (
                <p>
                  No office tasks yet. Prepare a workflow above to add the first
                  linked stages.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
