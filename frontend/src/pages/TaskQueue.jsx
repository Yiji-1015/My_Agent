import { useState, useEffect, useCallback } from "react";

/*
 * ============================================================
 *  EZ Task Queue — ADHD 멀티태스킹 대시보드
 * ============================================================
 *
 *  지금: localStorage로 독립 실행
 *  나중에: API_BASE를 Java Main Agent 주소로 바꾸고
 *          useLocalStorage → useApi로 교체하면 연동 완료
 *
 *  데이터 구조는 ez-agent-architecture.md의
 *  TaskRecord + SubTaskEntity 스키마를 그대로 따름.
 *
 * ============================================================
 */

// ====== API 설정 ======
// TODO: Java Main Agent 완성 후 아래 주석 해제하고 localStorage 모드 제거
// const API_BASE = "http://localhost:8080";
const USE_LOCAL = true; // false로 바꾸면 API 모드
const STORAGE_KEY = "ez-task-queue-v3";

// ====== 타입 (ez-agent-architecture.md TaskRecord 기반) ======
const PRIORITIES = ["urgent", "high", "medium", "low"];
const PRIORITY_LABELS = { urgent: "긴급", high: "높음", medium: "보통", low: "낮음" };
const PRIORITY_COLORS = { urgent: "#ef4444", high: "#f97316", medium: "#10b981", low: "#6b7280" };
const STATUS_FLOW = ["todo", "in_progress", "done"];
const STATUS_LABELS = { todo: "할 일", in_progress: "진행중", done: "완료" };

// ====== 유틸 ======
const genId = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10);

const daysUntil = (deadline) => {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  return diff;
};

const deadlineInfo = (deadline) => {
  const d = daysUntil(deadline);
  if (d === null) return { text: "마감없음", type: "none" };
  if (d < 0) return { text: `D+${Math.abs(d)} 지남`, type: "overdue" };
  if (d === 0) return { text: "오늘 마감!", type: "overdue" };
  if (d <= 3) return { text: `D-${d}`, type: "soon" };
  return { text: `D-${d}`, type: "ok" };
};

const sortTasks = (arr) =>
  [...arr].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    const da = daysUntil(a.deadline);
    const db = daysUntil(b.deadline);
    if (da !== null && db !== null && da !== db) return da - db;
    if (da !== null && db === null) return -1;
    if (da === null && db !== null) return 1;
    const ps = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (ps[a.priority] || 4) - (ps[b.priority] || 4);
  });

// ====== Envelope 생성 (ez-agent-architecture.md 표준) ======
const createEnvelope = (task, action) => ({
  envelope: {
    task_id: task.id,
    source: "task-queue-frontend",
    target: "main-agent",
    timestamp: new Date().toISOString(),
    version: "1.0",
  },
  context: {
    original_input: task.title,
    deadline: task.deadline || null,
    tags: task.tags || [],
    priority: task.priority,
    metadata: { memo: task.memo, learnings: task.learnings },
  },
  payload: {
    type: action,
    data: task,
  },
  history: [
    {
      agent: "task-queue-frontend",
      action: action,
      timestamp: new Date().toISOString(),
    },
  ],
});

// ====== API 함수 (나중에 Java 연동용) ======
const api = {
  async getTasks() {
    if (USE_LOCAL) return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  },
  async createTask(task) {
    if (USE_LOCAL) {
      const tasks = await this.getTasks();
      tasks.push(task);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return task;
    }
  },
  async updateTask(task) {
    if (USE_LOCAL) {
      const tasks = await this.getTasks();
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) tasks[idx] = task;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return task;
    }
  },
  async deleteTask(id) {
    if (USE_LOCAL) {
      const tasks = (await this.getTasks()).filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return;
    }
  },
  async requestDecomposition(task) {
    const envelope = createEnvelope(task, "request_decomposition");
    if (USE_LOCAL) {
      console.log("[EZ Agent] AI 분해 요청 Envelope:", JSON.stringify(envelope, null, 2));
      return null;
    }
  },
};

// ====== 초기 데이터 ======
const DEFAULT_TASKS = [
  { id: genId(), title: "가짜연구소 프로젝트", priority: "high", status: "in_progress", deadline: "2026-04-15", memo: "PseudoLab 9기 — RAG 고도화 파트", learnings: "", tags: ["project", "rag"], created_at: new Date().toISOString() },
  { id: genId(), title: "아모레퍼시픽 제안서", priority: "urgent", status: "todo", deadline: "2026-04-05", memo: "AI 기반 마케팅 분석 플랫폼 제안", learnings: "", tags: ["rfp", "proposal"], created_at: new Date().toISOString() },
  { id: genId(), title: "OpenClaw 데모 제작", priority: "high", status: "in_progress", deadline: "2026-04-20", memo: "", learnings: "", tags: ["project", "demo"], created_at: new Date().toISOString() },
  { id: genId(), title: "Elasticsearch 공부", priority: "medium", status: "todo", deadline: "", memo: "Docker + Kibana 환경, CSV 인제스트", learnings: "", tags: ["study"], created_at: new Date().toISOString() },
  { id: genId(), title: "정보처리기사 실기", priority: "high", status: "in_progress", deadline: "2026-05-10", memo: "Java OOP, SQL, 소프트웨어공학", learnings: "", tags: ["exam"], created_at: new Date().toISOString() },
  { id: genId(), title: "딥러닝/파이토치 강의", priority: "medium", status: "todo", deadline: "", memo: "", learnings: "", tags: ["study"], created_at: new Date().toISOString() },
  { id: genId(), title: "자소서 쓰기", priority: "high", status: "todo", deadline: "2026-04-10", memo: "삼성증권 AI서비스기획, 넷마블", learnings: "", tags: ["job", "resume"], created_at: new Date().toISOString() },
  { id: genId(), title: "나만의 에이전트 만들기", priority: "medium", status: "in_progress", deadline: "", memo: "EZ Agent — Java 메인에이전트 Step 1 진행중", learnings: "", tags: ["project", "agent"], created_at: new Date().toISOString() },
];

export default function TaskQueue() {
  const [tasks, setTasks] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDeadline, setNewDeadline] = useState("");

  useEffect(() => {
    (async () => {
      let loaded = await api.getTasks();
      if (!loaded.length) {
        for (const t of DEFAULT_TASKS) await api.createTask(t);
        loaded = DEFAULT_TASKS;
      }
      setTasks(loaded);
    })();
  }, []);

  const refresh = useCallback(async () => {
    setTasks(await api.getTasks());
  }, []);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const task = {
      id: genId(),
      title: newTitle.trim(),
      priority: newPriority,
      status: "todo",
      deadline: newDeadline,
      memo: "",
      learnings: "",
      tags: [],
      created_at: new Date().toISOString(),
    };
    await api.createTask(task);
    setNewTitle("");
    setNewDeadline("");
    await refresh();
  };

  const cycleStatus = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const next = STATUS_FLOW[(STATUS_FLOW.indexOf(task.status) + 1) % STATUS_FLOW.length];
    const updated = { ...task, status: next };
    if (next === "done") {
      updated.completed_at = new Date().toISOString();
      setExpandedId(id);
    }
    await api.updateTask(updated);
    await refresh();
  };

  const updateField = async (id, field, value) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await api.updateTask({ ...task, [field]: value });
    await refresh();
  };

  const deleteTask = async (id) => {
    await api.deleteTask(id);
    if (expandedId === id) setExpandedId(null);
    await refresh();
  };

  const requestAiDecompose = async (task) => {
    await api.requestDecomposition(task);
    if (typeof window.sendPrompt === "function") {
      window.sendPrompt(
        `내 태스크 "${task.title}"를 서브태스크로 분해해줘.\\n마감일: ${task.deadline || "없음"}\\n메모: ${task.memo || "없음"}\\n\\nez-agent-architecture.md의 Task Analyzer 형식으로 분해해줘.`
      );
    }
  };

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    urgent: tasks.filter(
      (t) => t.status !== "done" && daysUntil(t.deadline) !== null && daysUntil(t.deadline) <= 3
    ).length,
  };

  const alerts = tasks
    .filter((t) => t.status !== "done" && daysUntil(t.deadline) !== null)
    .map((t) => {
      const d = daysUntil(t.deadline);
      if (d < 0) return { type: "overdue", text: `"${t.title}" 마감이 ${Math.abs(d)}일 지났어!` };
      if (d <= 2) return { type: "soon", text: `"${t.title}" 마감 ${d === 0 ? "오늘" : d + "일 남음"}!` };
      return null;
    })
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans text-foreground">
      {/* 알림 배너 */}
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium border ${
            a.type === "overdue" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
          }`}
        >
          {a.text}
        </div>
      ))}

      {/* 통계 (텍스트 가로 나열) */}
      <div className="flex flex-wrap items-center gap-4 mb-6 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">전체 태스크</span>
          <span className="text-lg font-bold text-foreground">{stats.total}</span>
        </div>
        <div className="w-px h-4 bg-border hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">진행중</span>
          <span className="text-lg font-bold text-foreground">{stats.inProgress}</span>
        </div>
        <div className="w-px h-4 bg-border hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">완료</span>
          <span className="text-lg font-bold text-foreground">{stats.done}</span>
        </div>
        <div className="w-px h-4 bg-border hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">긴급 마감</span>
          <span className="text-lg font-bold text-red-500 dark:text-red-400">{stats.urgent}</span>
        </div>
      </div>

      {/* 입력 바 */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <input
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
          placeholder="새 태스크 추가..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <select
          className="px-2 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
        <input
          type="date"
          className="px-2 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
          value={newDeadline}
          onChange={(e) => setNewDeadline(e.target.value)}
        />
        <button
          onClick={addTask}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 font-medium transition"
        >
          추가
        </button>
      </div>

      {/* 칸반 보드 (가로 3단) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {STATUS_FLOW.map(statusCol => {
          const colTasks = sortTasks(tasks.filter(t => t.status === statusCol));
          
          return (
            <div key={statusCol} className="flex flex-col gap-3 bg-muted/30 p-4 rounded-2xl border border-border">
              <div className="font-bold px-2 pb-2 border-b border-border mb-1 flex items-center justify-between">
                <span className="text-foreground">{STATUS_LABELS[statusCol]}</span>
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-semibold">{colTasks.length}</span>
              </div>
              
              {!colTasks.length && <div className="text-center py-6 text-muted-foreground text-sm">태스크 없음</div>}
              
              {colTasks.map((t) => {
                const isExpanded = expandedId === t.id;
                const isDone = t.status === "done";
                
                const dl = deadlineInfo(t.deadline);
                const dlClasses = {
                  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
                  soon: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                  ok: "bg-green-500/10 text-green-600 dark:text-green-400",
                  none: "bg-muted text-muted-foreground"
                };

                return (
                  <div
                    key={t.id}
                    className={`rounded-xl border transition shadow-sm bg-card text-card-foreground ${
                      isExpanded ? "border-ring" : "border-border hover:border-gray-400/50"
                    }`}
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); cycleStatus(t.id); }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 transition ${
                          isDone ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30 text-transparent"
                        }`}
                      >
                        {isDone && "✓"}
                      </button>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: PRIORITY_COLORS[t.priority] }}
                      />
                      <span className={`text-sm font-medium flex-1 truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {t.title}
                      </span>
                      <div className="flex flex-col gap-1 items-end flex-shrink-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${dlClasses[dl.type]}`}>
                          {dl.text}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-border pt-3">
                        <div className="flex gap-2 items-center mb-3 flex-wrap">
                          <select
                            className="text-xs px-2 py-1.5 rounded-md border border-input bg-background text-foreground"
                            value={t.priority}
                            onChange={(e) => updateField(t.id, "priority", e.target.value)}
                          >
                            {PRIORITIES.map((p) => (
                              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                            ))}
                          </select>
                          <input
                            type="date"
                            className="text-xs px-2 py-1.5 rounded-md border border-input bg-background text-foreground"
                            value={t.deadline}
                            onChange={(e) => updateField(t.id, "deadline", e.target.value)}
                          />
                        </div>

                        <div className="text-xs font-semibold text-muted-foreground mb-1.5">메모</div>
                        <textarea
                          className="w-full min-h-[60px] p-2.5 rounded-lg bg-muted/50 border border-input text-sm text-foreground resize-y outline-none focus:ring-1 focus:ring-ring"
                          placeholder="할 일 메모..."
                          defaultValue={t.memo}
                          onBlur={(e) => updateField(t.id, "memo", e.target.value)}
                        />

                        {isDone && (
                          <div className="mt-3">
                            <div className="text-xs font-semibold text-muted-foreground mb-1.5">교훈 기록</div>
                            <textarea
                              className="w-full min-h-[60px] p-2.5 rounded-lg bg-muted/50 border border-input text-sm text-foreground resize-y outline-none focus:ring-1 focus:ring-ring"
                              placeholder="배운 점..."
                              defaultValue={t.learnings}
                              onBlur={(e) => updateField(t.id, "learnings", e.target.value)}
                            />
                          </div>
                        )}

                        <div className="flex gap-2 mt-4 flex-wrap">
                          <button
                            onClick={() => cycleStatus(t.id)}
                            className="text-xs px-3 py-1.5 font-medium rounded-md border border-input bg-background text-foreground hover:bg-muted transition"
                          >
                            상태 변경
                          </button>
                          <button
                            onClick={() => deleteTask(t.id)}
                            className="text-xs px-3 py-1.5 font-medium rounded-md border border-red-200 text-red-600 bg-red-50/10 hover:bg-red-500/10 dark:border-red-500/30 dark:text-red-400 transition"
                          >
                            삭제
                          </button>
                          {t.status !== "done" && (
                            <button
                              onClick={() => requestAiDecompose(t)}
                              className="text-xs px-3 py-1.5 font-medium rounded-md border border-blue-200 text-blue-600 bg-blue-50/10 hover:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400 transition"
                            >
                              AI로 분해
                            </button>
                          )}
                        </div>
                        {t.learnings && (
                          <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary leading-relaxed">
                            💡 {t.learnings}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-6 text-xs text-muted-foreground font-medium">
        {USE_LOCAL ? "🔧 로컬 모드 (localStorage)" : "🌐 API 모드 (Java Main Agent)"}
        {USE_LOCAL && " — Java 연동 시 USE_LOCAL = false 지정"}
      </div>
    </div>
  );
}
