import { useState, useCallback, useRef } from "react";
import {
  type AgentPlugin,
  type EnvelopeState,
  type GraphNode,
  type Subtask,
  DEFAULT_AGENTS,
  INITIAL_ENVELOPE,
  buildGraphNodes,
  detectAnalyzer,
  FALLBACK_SUBTASKS,
} from "@/lib/orchestration";

export type Phase = "idle" | "processing" | "done";

interface OrchestrationState {
  phase: Phase;
  agents: AgentPlugin[];
  envelope: EnvelopeState;
  graphNodes: GraphNode[];
  subtasks: Subtask[];
  input: string;
  selectedAnalyzer: string;
}

function now() {
  return new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function useOrchestration() {
  const [state, setState] = useState<OrchestrationState>({
    phase: "idle",
    agents: DEFAULT_AGENTS.map((a) => ({ ...a })),
    envelope: { ...INITIAL_ENVELOPE },
    graphNodes: [],
    subtasks: [],
    input: "",
    selectedAnalyzer: "general",
  });

  const abortRef = useRef(false);

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      const id = setTimeout(resolve, ms);
      // Check abort after timeout
      const check = setInterval(() => {
        if (abortRef.current) {
          clearTimeout(id);
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => clearInterval(check), ms + 50);
    });

  const setAgentStatus = (
    agentId: string,
    status: "idle" | "working" | "done"
  ) => {
    setState((prev) => ({
      ...prev,
      agents: prev.agents.map((a) =>
        a.id === agentId ? { ...a, status } : a
      ),
    }));
  };

  const updateGraphNode = (
    nodeId: string,
    status: "pending" | "active" | "done" | "skipped"
  ) => {
    setState((prev) => ({
      ...prev,
      graphNodes: prev.graphNodes.map((n) =>
        n.id === nodeId ? { ...n, status } : n
      ),
    }));
  };

  const updateEnvelope = (partial: Partial<EnvelopeState>) => {
    setState((prev) => ({
      ...prev,
      envelope: { ...prev.envelope, ...partial },
    }));
  };

  const addHistory = (agent: string, action: string) => {
    setState((prev) => ({
      ...prev,
      envelope: {
        ...prev.envelope,
        history: [
          ...prev.envelope.history,
          { agent, timestamp: now(), action },
        ],
      },
    }));
  };

  const run = useCallback(async (userInput: string) => {
    abortRef.current = false;
    const analyzer = detectAnalyzer(userInput);
    const nodes = buildGraphNodes(analyzer);

    // Reset
    setState({
      phase: "processing",
      agents: DEFAULT_AGENTS.map((a) => ({ ...a, status: "idle" as const })),
      envelope: {
        sender: "user",
        receiver: "router",
        context: userInput,
        payload: {},
        history: [],
      },
      graphNodes: nodes,
      subtasks: [],
      input: userInput,
      selectedAnalyzer: analyzer,
    });

    // Step 1: Input node
    await sleep(400);
    updateGraphNode("input", "active");
    addHistory("system", "사용자 입력 수신");
    await sleep(800);
    updateGraphNode("input", "done");

    // Step 2: Router
    updateGraphNode("router", "active");
    setAgentStatus("router", "working");
    updateEnvelope({ sender: "input_node", receiver: "router" });
    addHistory("router", "의도 분석 및 라우팅 키워드 추출 중...");
    await sleep(1500);
    updateEnvelope({
      sender: "router",
      receiver: analyzer === "general" ? "general_analyzer" : `${analyzer}_analyzer`,
      payload: {
        detected_intent: analyzer === "rfp" ? "RFP/제안서 작성" : analyzer === "template" ? "템플릿 분석" : "일반 태스크",
        routing_keywords: analyzer === "rfp" ? ["제안서", "RFP"] : analyzer === "template" ? ["템플릿"] : ["일반"],
        confidence: 0.94,
      },
    });
    addHistory("router", `→ ${analyzer.toUpperCase()} Analyzer로 라우팅 결정`);
    setAgentStatus("router", "done");
    updateGraphNode("router", "done");

    // Step 3: Analyzer
    updateGraphNode("analyzer", "active");
    setAgentStatus(analyzer, "working");
    updateEnvelope({ sender: "router", receiver: `${analyzer}_analyzer` });
    addHistory(`${analyzer}_analyzer`, "태스크 분해 및 심층 분석 진행 중...");
    await sleep(2000);

    let subtasks = FALLBACK_SUBTASKS;
    try {
      // 🚀 실제 자바 스프링부트 오케스트레이터 엔진(8080) 호출!
      const response = await fetch("http://localhost:8080/api/tasks/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalInput: userInput,
          deadline: null,
          attachments: []
        })
      });

      if (response.ok) {
        const data = await response.json();
        // 자바가 전달해준 실제 Python 에이전트의 분해 결과물을 꽂아넣습니다!
        if (data.subtasks && data.subtasks.length > 0) {
          subtasks = data.subtasks.map((st: any) => ({
            title: st.title,
            estimatedMin: st.estimatedMin || 30,
            priority: "medium", // 우선순위는 임시로 medium 부여
            handledBy: analyzer === "rfp" ? "RFP Analyzer" : analyzer === "template" ? "Template Analyzer" : "Task Analyzer"
          }));
        }
      } else {
        console.error("Backend response error:", await response.text());
      }
    } catch (e) {
      console.warn("백엔드(8080) 서버가 꺼져있어 FALLBACK 임시 데이터를 사용합니다.", e);
    }

    updateEnvelope({
      sender: `${analyzer}_analyzer`,
      receiver: "time_estimator",
      payload: {
        detected_intent: analyzer === "rfp" ? "RFP/제안서 작성" : "일반 태스크",
        routing_keywords: analyzer === "rfp" ? ["제안서", "RFP"] : ["일반"],
        confidence: 0.94,
        subtask_count: subtasks.length,
        raw_subtasks: subtasks.map((s) => s.title),
      },
    });
    addHistory(`${analyzer}_analyzer`, `${subtasks.length}개 서브태스크 분해 완료`);
    setAgentStatus(analyzer, "done");
    updateGraphNode("analyzer", "done");

    // Mark skipped analyzers
    DEFAULT_AGENTS.forEach((a) => {
      if (a.type === "plugin" && a.id !== analyzer && a.id !== "time_estimator") {
        // skipped
      }
    });

    // Step 4: Time Estimator
    updateGraphNode("time_estimator", "active");
    setAgentStatus("time_estimator", "working");
    updateEnvelope({ sender: `${analyzer}_analyzer`, receiver: "time_estimator" });
    addHistory("time_estimator", "각 서브태스크 소요 시간 산출 중...");
    await sleep(1500);

    const totalMin = subtasks.reduce((s, t) => s + t.estimatedMin, 0);
    updateEnvelope({
      sender: "time_estimator",
      receiver: "output",
      payload: {
        detected_intent: analyzer === "rfp" ? "RFP/제안서 작성" : "일반 태스크",
        confidence: 0.94,
        subtask_count: subtasks.length,
        final_subtasks: subtasks.map((s) => ({
          title: s.title,
          estimatedMin: s.estimatedMin,
          priority: s.priority,
          handledBy: s.handledBy,
        })),
        total_estimated_min: totalMin,
        status: "completed",
      },
    });
    addHistory("time_estimator", `총 예상 소요 시간: ${totalMin}분 산출 완료`);
    setAgentStatus("time_estimator", "done");
    updateGraphNode("time_estimator", "done");

    // Step 5: Done
    await sleep(600);
    updateGraphNode("done", "active");
    addHistory("system", "오케스트레이션 완료 ✅");
    await sleep(400);
    updateGraphNode("done", "done");

    setState((prev) => ({ ...prev, phase: "done", subtasks }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({
      phase: "idle",
      agents: DEFAULT_AGENTS.map((a) => ({ ...a })),
      envelope: { ...INITIAL_ENVELOPE },
      graphNodes: [],
      subtasks: [],
      input: "",
      selectedAnalyzer: "general",
    });
  }, []);

  return { ...state, run, reset };
}
