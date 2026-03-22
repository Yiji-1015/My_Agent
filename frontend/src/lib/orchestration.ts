// Orchestration types and simulation logic

export interface AgentPlugin {
  id: string;
  name: string;
  icon: string;
  status: "idle" | "working" | "done";
  keywords: string[];
  type: "core" | "plugin";
  description: string;
}

export interface EnvelopeState {
  sender: string;
  receiver: string;
  context: string;
  payload: Record<string, unknown>;
  history: HistoryEntry[];
}

export interface HistoryEntry {
  agent: string;
  timestamp: string;
  action: string;
}

export interface GraphNode {
  id: string;
  label: string;
  icon: string;
  status: "pending" | "active" | "done" | "skipped";
}

export interface Subtask {
  title: string;
  estimatedMin: number;
  priority?: "high" | "medium" | "low";
  handledBy?: string;
}

export const DEFAULT_AGENTS: AgentPlugin[] = [
  {
    id: "router",
    name: "Router Node",
    icon: "🚦",
    status: "idle",
    keywords: [],
    type: "core",
    description: "의도 분석 및 에이전트 라우팅",
  },
  {
    id: "general",
    name: "General Task Analyzer",
    icon: "🧠",
    status: "idle",
    keywords: [],
    type: "core",
    description: "범용 태스크 분석 (Fallback)",
  },
  {
    id: "time_estimator",
    name: "Time Estimator",
    icon: "⏱️",
    status: "idle",
    keywords: [],
    type: "core",
    description: "서브태스크 소요 시간 계산",
  },
  {
    id: "template",
    name: "Template Analyzer",
    icon: "🧩",
    status: "idle",
    keywords: ["템플릿", "테스트"],
    type: "plugin",
    description: "템플릿 기반 분석 플러그인",
  },
  {
    id: "rfp",
    name: "RFP Analyzer",
    icon: "📝",
    status: "idle",
    keywords: ["제안서", "RFP", "공공사업"],
    type: "plugin",
    description: "제안서/RFP 전문 분석 플러그인",
  },
];

export const INITIAL_ENVELOPE: EnvelopeState = {
  sender: "user",
  receiver: "router",
  context: "",
  payload: {},
  history: [],
};

export function buildGraphNodes(selectedAnalyzer: string): GraphNode[] {
  const analyzerLabel =
    selectedAnalyzer === "rfp"
      ? "RFP Analyzer"
      : selectedAnalyzer === "template"
      ? "Template Analyzer"
      : "General Analyzer";
  const analyzerIcon =
    selectedAnalyzer === "rfp"
      ? "📝"
      : selectedAnalyzer === "template"
      ? "🧩"
      : "🧠";

  return [
    { id: "input", label: "입력", icon: "📥", status: "pending" },
    { id: "router", label: "Router", icon: "🚦", status: "pending" },
    { id: "analyzer", label: analyzerLabel, icon: analyzerIcon, status: "pending" },
    { id: "time_estimator", label: "Time Estimator", icon: "⏱️", status: "pending" },
    { id: "done", label: "완료", icon: "✅", status: "pending" },
  ];
}

export function detectAnalyzer(input: string): string {
  const lower = input.toLowerCase();
  if (["제안서", "rfp", "공공사업"].some((k) => lower.includes(k))) return "rfp";
  if (["템플릿", "테스트"].some((k) => lower.includes(k))) return "template";
  return "general";
}

export const FALLBACK_SUBTASKS: Subtask[] = [
  { title: "프로젝트 맥락 분석 및 자료 수집", estimatedMin: 30, priority: "high", handledBy: "RFP Analyzer" },
  { title: "목차 및 구조 설계", estimatedMin: 60, priority: "high", handledBy: "RFP Analyzer" },
  { title: "핵심 내용 초안 작성", estimatedMin: 90, priority: "medium", handledBy: "Content Writer" },
  { title: "시각 자료 및 도표 제작", estimatedMin: 45, priority: "medium", handledBy: "Design Agent" },
  { title: "리뷰 및 최종 검수", estimatedMin: 30, priority: "low", handledBy: "QA Agent" },
  { title: "최종 제출 및 백업", estimatedMin: 15, priority: "low", handledBy: "Scheduler" },
];
