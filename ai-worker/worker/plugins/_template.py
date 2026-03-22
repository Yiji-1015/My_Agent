from worker.envelope import AgentState

# 새로운 에이전트 추가 시 이 구조체 안에 라우팅 트리거 단어들을 적어주세요.
AGENT_CONFIG = {
    "name": "template_analyzer",  # 그래프 노드 이름으로 사용됨
    "route_keywords": ["템플릿", "테스트용키워드"],
}

def analyze(state: AgentState) -> dict:
    """새로운 분석 도메인의 에이전트 핵심 로직"""
    node_name = AGENT_CONFIG["name"]
    print(f"🧩 [{node_name}] 플러그인이 실행되어 데이터를 분석합니다...")
    
    # 1. Payload 가져오기
    payload = state.get("payload", {})
    context = state.get("context", {})
    
    # 여기서 도메인 특화(학회/RFP/면접 등) AI 분석 로직을 수행합니다.
    # 예시용으로 subtasks를 구조화해서 넣습니다.
    if "final_subtasks" not in payload:
        payload["final_subtasks"] = []
        
    payload["final_subtasks"].append({
        "title": f"[{node_name}] 도메인 특화 서브태스크",
        "estimated_min": 60
    })
    
    # 2. 다음 수신자(봉투) 명시
    envelope = state.get("envelope", {})
    envelope["sender"] = node_name
    envelope["receiver"] = "time_estimator" # 기본적으로 분석이 끝나면 time_estimator로 넘어갑니다.
    
    # 3. 변경된 부분만 리턴하면 LangGraph가 state에 merge 해줍니다. (history는 자동 append)
    return {
        "envelope": envelope,
        "payload": payload,
        "history": [f"{node_name} execution ok"]
    }
