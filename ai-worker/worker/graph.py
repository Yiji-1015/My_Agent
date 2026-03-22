from langgraph.graph import StateGraph, END
from worker.envelope import AgentState
from worker.nodes.router import router_node
from worker.nodes.task_analyzer import task_analyzer_node
from worker.nodes.time_estimator import time_estimator_node
from worker.plugins import plugin_nodes

# 1. 아키텍처에서 규격화한 통신 표준(AgentState 봉투)으로 그래프 껍데기를 생성합니다.
workflow = StateGraph(AgentState)

# 2. 기본 내장 노드들 등록
workflow.add_node("router", router_node)
workflow.add_node("task_analyzer", task_analyzer_node)
workflow.add_node("time_estimator", time_estimator_node)

# 3. 플러그인(plugins) 폴더에 있는 모든 커스텀 에이전트를 동적으로 주입!
for node_name, func in plugin_nodes.items():
    workflow.add_node(node_name, func)

# 4. 라우터(Router) 노드에서 어디로 보낼지 결정하는 함수 (오케스트레이션 로직)
def route_next_step(state: AgentState):
    envelope = state.get("envelope", {})
    # Router 노드가 계산한 목적지를 봉투(Envelope) 기반으로 꺼냄
    receiver = envelope.get("receiver", "task_analyzer")
    return receiver

# 5. 분기 설정
workflow.add_conditional_edges(
    "router",
    route_next_step
)

# 6. 모든 분석가 노드(일반/플러그인 둘다)는 끝나면 시간 예측가(time_estimator)에게 보냄
workflow.add_edge("task_analyzer", "time_estimator")
for plugin_name in plugin_nodes.keys():
    workflow.add_edge(plugin_name, "time_estimator")

workflow.add_edge("time_estimator", END)

# 시작점 설정
workflow.set_entry_point("router")

# 7. 조립 완성!
ai_brain = workflow.compile()