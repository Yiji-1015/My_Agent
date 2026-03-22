import { toast } from "@/hooks/use-toast";

const API_BASE = "http://localhost:8080";

export interface Subtask {
  title: string;
  estimatedMin: number;
  priority?: "high" | "medium" | "low";
  handledBy?: string;
}

export interface AgentStep {
  id: string;
  icon: string;
  label: string;
  description: string;
  durationMs: number;
}

export interface TaskResponse {
  taskId: string;
  subtasks: Subtask[];
}

export interface TaskRequest {
  originalInput: string;
  deadline: string;
  attachments: string[];
}

export const AGENT_STEPS: AgentStep[] = [
  {
    id: "router",
    icon: "🚦",
    label: "Router Node",
    description: "의도를 분석하고 라우팅 키워드를 추출하고 있어요...",
    durationMs: 1500,
  },
  {
    id: "analyzer",
    icon: "🔄",
    label: "Specialized Plugin Analyzer",
    description: "전문 에이전트가 업무를 세밀하게 분해하고 있어요...",
    durationMs: 2000,
  },
  {
    id: "estimator",
    icon: "⏱️",
    label: "Time Estimator",
    description: "각 서브태스크의 소요 시간을 계산하고 있어요...",
    durationMs: 1500,
  },
  {
    id: "scheduler",
    icon: "📅",
    label: "Java Scheduling Engine",
    description: "실제 캘린더 좌표에 태스크를 매핑하고 있어요...",
    durationMs: 1000,
  },
];

const FALLBACK_SUBTASKS: Subtask[] = [
  { title: "프로젝트 맥락 분석 및 자료 수집", estimatedMin: 30, priority: "high", handledBy: "RFP Analyzer" },
  { title: "목차 및 구조 설계", estimatedMin: 60, priority: "high", handledBy: "RFP Analyzer" },
  { title: "핵심 내용 초안 작성", estimatedMin: 90, priority: "medium", handledBy: "Content Writer" },
  { title: "시각 자료 및 도표 제작", estimatedMin: 45, priority: "medium", handledBy: "Design Agent" },
  { title: "리뷰 및 최종 검수", estimatedMin: 30, priority: "low", handledBy: "QA Agent" },
  { title: "최종 제출 및 백업", estimatedMin: 15, priority: "low", handledBy: "Scheduler" },
];

export async function createTask(req: TaskRequest): Promise<TaskResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    toast({
      title: "⚠️ 데모 모드 전환",
      description: "백엔드와 연결되지 않아 임시 데모 모드로 전환합니다. 걱정 마세요, 모든 UI는 정상 작동해요! 💜",
      duration: 5000,
    });

    return {
      taskId: crypto.randomUUID(),
      subtasks: FALLBACK_SUBTASKS,
    };
  }
}
