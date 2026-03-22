from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict

# 방금 만든 3인방을 불러옵니다! ⭐️ (추가된 부분)
from worker.nodes.router import router_node
from worker.nodes.task_analyzer import task_analyzer_node
from worker.nodes.time_estimator import time_estimator_node


# 1. AI가 생각할 때 사용할 메모리장(상태) 구조
class AgentState(TypedDict):
    task_input: str
    route_decision: str
    analyzed_data: dict
    final_subtasks: List[dict]

# 2. 에이전트 노드들 (각자의 역할)
def router_node(state: AgentState):
    print("🚦 [Router] 태스크 유형을 분류합니다...")
    # 나중에 LLM이 "이건 RFP 문서군!" 하고 판단하게 할 겁니다.
    return {"route_decision": "default"}

def task_analyzer_node(state: AgentState):
    print("🧠 [Task Analyzer] 서브태스크로 쪼개는 중...")
    return {"final_subtasks": [{"title": "임시 작업", "estimated_min": 60}]}

def time_estimator_node(state: AgentState):
    print("⏱️ [Time Estimator] 소요 시간 추정 중...")
    return state

# 3. 뇌 구조(그래프) 조립
workflow = StateGraph(AgentState)

workflow.add_node("router", router_node)
workflow.add_node("task_analyzer", task_analyzer_node)
workflow.add_node("time_estimator", time_estimator_node)

# 시작점 설정
workflow.set_entry_point("router")

# 선 연결 (Router -> Analyzer -> Estimator -> 끝)
workflow.add_edge("router", "task_analyzer")
workflow.add_edge("task_analyzer", "time_estimator")
workflow.add_edge("time_estimator", END)

# 뇌 완성!
ai_brain = workflow.compile()