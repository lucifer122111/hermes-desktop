import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Brain,
  Check,
  Circle,
  Clock3,
  FileText,
  Layers3,
  ListTodo,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { ChatRun } from "../screens/Layout/chatRuns";
import {
  focusSeconds,
  readWorkspace,
  workspaceKey,
  type WorkspaceState,
} from "./workspaceState";

type Session = Awaited<ReturnType<Window["hermesAPI"]["listSessions"]>>[number];
type Profile = Awaited<ReturnType<Window["hermesAPI"]["listProfiles"]>>[number];
type Task = NonNullable<
  Awaited<ReturnType<Window["hermesAPI"]["kanbanListTasks"]>>["data"]
>[number];
export type WorkspaceDestination =
  "chat" | "memory" | "kanban" | "office" | "schedules" | "tools" | "agents";
interface Props {
  connectionId: string;
  profile: string;
  visible: boolean;
  remoteMode: boolean;
  runs: ChatRun[];
  onNavigate: (view: WorkspaceDestination) => void;
  onNewChat: () => void;
  onResume: (id: string) => void;
  onSearch: () => void;
}

export default function Workspace({
  connectionId,
  profile,
  visible,
  remoteMode,
  runs,
  onNavigate,
  onNewChat,
  onResume,
  onSearch,
}: Props): React.JSX.Element {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(() =>
    readWorkspace(connectionId, profile),
  );
  const [saveError, setSaveError] = useState("");
  const [goal, setGoal] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskMessage, setTaskMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [now, setNow] = useState(Date.now);
  const inflight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const updateWorkspace = useCallback(
    (change: (s: WorkspaceState) => WorkspaceState) => {
      setWorkspace(change);
    },
    [],
  );
  useEffect(() => {
    try {
      localStorage.setItem(
        workspaceKey(connectionId, profile),
        JSON.stringify(workspace),
      );
      setSaveError("");
    } catch {
      setSaveError(
        "These changes could not be saved. Copy your notes before closing Mighty.",
      );
    }
  }, [workspace, connectionId, profile]);
  const refresh = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const results = await Promise.allSettled([
        window.hermesAPI.listSessions(8, 0, connectionId, profile),
        window.hermesAPI.listProfiles(),
        remoteMode
          ? Promise.resolve({
              success: false,
              error: "Task board is available on local or SSH connections.",
            })
          : window.hermesAPI.kanbanListTasks({ profile }),
      ]);
      if (!mounted.current) return;
      const failures: string[] = [];
      if (results[0].status === "fulfilled") setSessions(results[0].value);
      else failures.push("Recent conversations are unavailable.");
      if (results[1].status === "fulfilled") setProfiles(results[1].value);
      else failures.push("Agent status is unavailable.");
      if (results[2].status === "fulfilled" && results[2].value.success)
        setTasks((results[2].value as { data?: Task[] }).data || []);
      else if (!remoteMode)
        failures.push(
          "The task board is unavailable. Open Workflows to check the connection.",
        );
      setErrors(failures);
      setLoading(false);
    } finally {
      inflight.current = false;
    }
  }, [connectionId, profile, remoteMode]);
  useEffect(() => {
    if (!visible) return;
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 15000);
    return () => {
      clearInterval(timer);
    };
  }, [visible, refresh]);
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [visible]);
  const current = profiles.find((p) => p.id === profile);
  const running = runs.filter(
    (r) => r.loading && r.connectionId === connectionId,
  );
  const remaining = focusSeconds(workspace, now);
  const recentTasks = tasks
    .filter((task) => task.status !== "archived")
    .slice(0, 5);
  const queued = tasks.filter((task) =>
    ["triage", "todo", "ready", "scheduled"].includes(task.status),
  ).length;
  const greeting =
    new Date(now).getHours() < 12
      ? "Good morning"
      : new Date(now).getHours() < 18
        ? "Good afternoon"
        : "Good evening";
  async function createTask(): Promise<void> {
    if (!taskTitle.trim() || creating) return;
    setCreating(true);
    setTaskMessage("");
    try {
      const result = await window.hermesAPI.kanbanCreateTask(
        { title: taskTitle.trim(), triage: true },
        profile,
      );
      if (!result.success)
        throw new Error(result.error || "Could not create task.");
      setTaskTitle("");
      setTaskMessage("Added to your board for review.");
      await refresh();
    } catch (err) {
      setTaskMessage(
        err instanceof Error ? err.message : "Could not create task.",
      );
    } finally {
      setCreating(false);
    }
  }
  const nodes = profiles.slice(0, 6);
  return (
    <div className="mighty-page mighty-workspace">
      <div className="mighty-page-heading">
        <div>
          <span className="mighty-eyebrow">YOUR DAY, IN VIEW</span>
          <h1>{greeting}.</h1>
          <p>One place for your ideas, your agents, and what comes next.</p>
        </div>
        <div className="mighty-inline-actions">
          <span className="mighty-date">
            {new Date(now).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
          <button
            className="mighty-icon-button"
            aria-label="Refresh workspace"
            onClick={() => void refresh()}
          >
            <RefreshCw size={17} />
          </button>
          <button className="mighty-button primary" onClick={onNewChat}>
            <Plus size={16} />
            New conversation
          </button>
        </div>
      </div>
      {errors.length > 0 && (
        <div role="status" className="mighty-notice">
          {errors.join(" ")}
        </div>
      )}
      <div className="mighty-metrics">
        {[
          { label: "Running now", value: running.length, icon: Sparkles },
          {
            label: "Open conversations",
            value: runs.filter(
              (r) =>
                r.connectionId === connectionId &&
                (r.sessionId || r.title || r.loading),
            ).length,
            icon: Layers3,
          },
          {
            label: "Queued tasks",
            value:
              loading ||
              errors.some((e) => e.includes("task board")) ||
              remoteMode
                ? "—"
                : queued,
            icon: ListTodo,
          },
          {
            label: "Available skills",
            value: current?.skillCount ?? "—",
            icon: Brain,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div className="mighty-metric" key={label}>
            <Icon size={16} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="mighty-workspace-grid">
        <section className="mighty-card mighty-core-card">
          <div className="mighty-card-heading">
            <div>
              <span className="mighty-eyebrow">OPERATIONS</span>
              <h2>Your agent network</h2>
            </div>
            <button
              className="mighty-text-button"
              onClick={() => onNavigate("office")}
            >
              Open office <ArrowUpRight size={15} />
            </button>
          </div>
          <svg
            viewBox="0 0 520 245"
            className="mighty-network"
            role="img"
            aria-label={`${profiles.length} configured agent profiles; ${running.length} conversations working`}
          >
            <defs>
              <radialGradient id="mighty-core-glow">
                <stop stopColor="var(--accent)" stopOpacity=".16" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="260" cy="120" r="116" fill="url(#mighty-core-glow)" />
            <circle
              cx="260"
              cy="120"
              r="73"
              fill="none"
              stroke="var(--border)"
              strokeDasharray="3 8"
            />
            {nodes.map((p, i) => {
              const angle =
                (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
              const x = 260 + Math.cos(angle) * 183,
                y = 120 + Math.sin(angle) * 83;
              const busy = running.some((r) => r.profile === p.id);
              return (
                <g key={p.id}>
                  <path
                    d={`M260 120 L${x} ${y}`}
                    stroke={busy ? "var(--accent)" : "var(--border)"}
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="18"
                    fill="var(--bg-tertiary)"
                    stroke={busy ? "var(--accent)" : "var(--border-bright)"}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill={
                      busy
                        ? "var(--accent)"
                        : p.gatewayRunning
                          ? "var(--success)"
                          : "var(--text-muted)"
                    }
                  />
                  <text
                    x={x}
                    y={y + 34}
                    textAnchor="middle"
                    fill="var(--text-secondary)"
                    fontSize="11"
                  >
                    {p.name.slice(0, 20)}
                  </text>
                  <title>
                    {p.name}:{" "}
                    {busy
                      ? "Working"
                      : p.gatewayRunning
                        ? "Gateway online"
                        : "Gateway offline"}
                  </title>
                </g>
              );
            })}
            <circle
              cx="260"
              cy="120"
              r="40"
              fill="var(--bg-primary)"
              stroke="var(--border-bright)"
            />
            <text
              x="260"
              y="118"
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize="12"
              fontWeight="700"
              letterSpacing="2"
            >
              MIGHTY
            </text>
            <text
              x="260"
              y="135"
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="9"
            >
              {running.length ? `${running.length} working` : "WORKSPACE"}
            </text>
          </svg>
          <div className="mighty-network-footer">
            <span>
              <i
                className={`mighty-dot ${current?.gatewayRunning ? "online" : ""}`}
              />
              {current
                ? current.gatewayRunning
                  ? "Agent gateway online"
                  : "Agent gateway offline"
                : "Checking agent gateway"}
            </span>
            <button
              className="mighty-text-button"
              onClick={() => onNavigate("agents")}
            >
              {profiles.length} profiles <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
        <section className="mighty-card">
          <div className="mighty-card-heading">
            <h2>Today’s intentions</h2>
            <span className="mighty-pill">
              {workspace.goals.filter((g) => g.done).length}/
              {workspace.goals.length}
            </span>
          </div>
          <p>Keep your priorities close. Saved for this workspace.</p>
          <form
            className="mighty-add-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!goal.trim() || workspace.goals.length >= 100) return;
              updateWorkspace((s) => ({
                ...s,
                goals: [
                  ...s.goals,
                  {
                    id: crypto.randomUUID(),
                    text: goal.trim().slice(0, 250),
                    done: false,
                  },
                ],
              }));
              setGoal("");
            }}
          >
            <input
              aria-label="New intention"
              placeholder="What matters today?"
              maxLength={250}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            <button
              className="mighty-icon-button"
              aria-label="Add intention"
              disabled={!goal.trim()}
            >
              <Plus size={18} />
            </button>
          </form>
          <div className="mighty-intentions">
            {workspace.goals.length === 0 && (
              <div className="mighty-empty">
                A little direction goes a long way.
              </div>
            )}
            {workspace.goals.map((item) => (
              <div
                key={item.id}
                className={`mighty-goal ${item.done ? "done" : ""}`}
              >
                <button
                  aria-label={`${item.done ? "Uncheck" : "Complete"} ${item.text}`}
                  onClick={() =>
                    updateWorkspace((s) => ({
                      ...s,
                      goals: s.goals.map((g) =>
                        g.id === item.id ? { ...g, done: !g.done } : g,
                      ),
                    }))
                  }
                >
                  {item.done ? <Check size={17} /> : <Circle size={17} />}
                </button>
                <span>{item.text}</span>
                <button
                  aria-label={`Remove ${item.text}`}
                  onClick={() =>
                    updateWorkspace((s) => ({
                      ...s,
                      goals: s.goals.filter((g) => g.id !== item.id),
                    }))
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="mighty-two-columns">
        <section className="mighty-card">
          <div className="mighty-card-heading">
            <h2>Pick up where you left off</h2>
            <button className="mighty-text-button" onClick={onSearch}>
              <Search size={14} />
              All conversations
            </button>
          </div>
          {loading && <p>Loading your recent conversations…</p>}
          {!loading && !sessions.length && (
            <p>No conversations found in this profile.</p>
          )}
          {sessions.slice(0, 5).map((session) => (
            <button
              key={session.id}
              className="mighty-session-row"
              onClick={() => onResume(session.id)}
              title={`${session.id}\n${new Date(session.startedAt * 1000).toLocaleString()}`}
            >
              <span className="mighty-session-icon">
                <FileText size={15} />
              </span>
              <span>
                <strong>
                  {session.title ||
                    session.preview?.slice(0, 70) ||
                    "Untitled conversation"}
                </strong>
                <small>
                  {session.model || session.source} · {session.messageCount}{" "}
                  messages
                </small>
              </span>
              <ArrowUpRight size={14} />
            </button>
          ))}
        </section>
        <section className="mighty-card">
          <div className="mighty-card-heading">
            <h2>Work in motion</h2>
            <button
              className="mighty-text-button"
              onClick={() => onNavigate("kanban")}
            >
              View board <ArrowUpRight size={14} />
            </button>
          </div>
          {recentTasks.map((task) => (
            <button
              className="mighty-task-row"
              key={task.id}
              onClick={() => onNavigate("kanban")}
            >
              <span>{task.title}</span>
              <span className="mighty-pill">{task.status}</span>
            </button>
          ))}
          {!loading && !recentTasks.length && (
            <p>Your next project starts here.</p>
          )}
          <form
            className="mighty-add-row"
            onSubmit={(e) => {
              e.preventDefault();
              void createTask();
            }}
          >
            <input
              aria-label="New task title"
              placeholder={
                remoteMode
                  ? "Task board requires local or SSH mode"
                  : "Add a task to the board…"
              }
              value={taskTitle}
              maxLength={250}
              disabled={remoteMode || creating}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <button
              className="mighty-icon-button"
              aria-label="Create task"
              disabled={remoteMode || creating || !taskTitle.trim()}
            >
              <Plus size={18} />
            </button>
          </form>
          {taskMessage && <p role="status">{taskMessage}</p>}
        </section>
      </div>
      <div className="mighty-journal-grid">
        <section className="mighty-card">
          <div className="mighty-card-heading">
            <h2>Scratchpad</h2>
            <span className="mighty-eyebrow">{profile}</span>
          </div>
          <textarea
            aria-label="Workspace scratchpad"
            placeholder="Ideas, reminders, a note to your future self…"
            value={workspace.journal}
            maxLength={30000}
            onChange={(e) =>
              updateWorkspace((s) => ({ ...s, journal: e.target.value }))
            }
          />
          {saveError && (
            <p className="mighty-error" role="alert">
              {saveError}
            </p>
          )}
        </section>
        <section className="mighty-card mighty-focus">
          <span className="mighty-eyebrow">
            <Clock3 size={13} />
            FOCUS TIME
          </span>
          <strong className="mighty-focus-clock">
            {String(Math.floor(remaining / 60)).padStart(2, "0")}:
            {String(remaining % 60).padStart(2, "0")}
          </strong>
          <p>
            {remaining === 0 ? "Time for a break." : "One thing at a time."}
          </p>
          <div className="mighty-inline-actions">
            <button
              className="mighty-button primary"
              onClick={() => {
                const instant = Date.now();
                setNow(instant);
                updateWorkspace((s) =>
                  s.focusEnd && focusSeconds(s, instant) > 0
                    ? {
                        ...s,
                        focusRemaining: focusSeconds(s, instant),
                        focusEnd: null,
                      }
                    : {
                        ...s,
                        focusEnd:
                          instant + (focusSeconds(s, instant) || 1500) * 1000,
                      },
                );
              }}
            >
              {workspace.focusEnd && remaining > 0 ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}{" "}
              {workspace.focusEnd && remaining > 0 ? "Pause" : "Start"}
            </button>
            <button
              className="mighty-icon-button"
              aria-label="Reset focus timer"
              onClick={() =>
                updateWorkspace((s) => ({
                  ...s,
                  focusEnd: null,
                  focusRemaining: 1500,
                }))
              }
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
