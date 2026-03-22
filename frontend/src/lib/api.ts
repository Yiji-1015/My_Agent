export interface TaskRequest {
  originalInput: string;
  deadline: string;
  attachments: string[];
}

export interface Subtask {
  title: string;
  estimatedMin: number;
  priority?: "high" | "medium" | "low";
}

export interface TaskResponse {
  taskId: string;
  subtasks: Subtask[];
}

const MOCK_RESPONSE: TaskResponse = {
  taskId: "mock-uuid-001",
  subtasks: [
    { title: "1. 텍스트 맥락 분석", estimatedMin: 30, priority: "high" },
    { title: "2. 제안서 목차 작성", estimatedMin: 60, priority: "high" },
    { title: "3. 각 섹션 초안 작성", estimatedMin: 120, priority: "medium" },
    { title: "4. 예산 및 일정표 작성", estimatedMin: 90, priority: "medium" },
    { title: "5. 최종 검토 및 수정", estimatedMin: 45, priority: "low" },
    { title: "6. 제출 준비 및 포맷팅", estimatedMin: 30, priority: "low" },
  ],
};

export async function submitTask(data: TaskRequest): Promise<TaskResponse> {
  try {
    const res = await fetch("http://localhost:8080/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API error");
    const json = await res.json();
    // Add priority if not present
    return {
      ...json,
      subtasks: json.subtasks.map((s: Subtask, i: number) => ({
        ...s,
        priority: s.priority || (i < 2 ? "high" : i < 4 ? "medium" : "low"),
      })),
    };
  } catch {
    // Fallback to mock data
    console.warn("API 호출 실패 — Mock 데이터를 사용합니다.");
    await new Promise((r) => setTimeout(r, 2000));
    return MOCK_RESPONSE;
  }
}
