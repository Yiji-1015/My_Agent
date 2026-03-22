import operator
from typing import TypedDict, List, Dict, Any, Annotated

class EnvelopeContext(TypedDict, total=False):
    original_input: str
    deadline: str
    tags: List[str]

class AgentState(TypedDict):
    """
    모든 에이전트 간의 통신 표준 'Envelope' (봉투형)
    이 구조를 준수해야 나중에 학회, 인터뷰, RFP 등 어떤 도메인이든
    자유롭게 플러그인 형태로 조립될 수 있습니다.
    """
    envelope: Dict[str, str]  # ex: {"sender": "router", "receiver": "task_analyzer"}
    context: EnvelopeContext  # 읽기 전용 (원본 요청, 불변 상태)
    payload: Dict[str, Any]   # 에이전트마다 수정/가공하며 채워나가는 실제 데이터
    history: Annotated[List[str], operator.add]  # 이제껏 어떤 노드들을 거쳤는지 자동 누적

# Router 첫 진입 시 사용할 봉투 초기화 유틸
def create_initial_envelope(original_input: str) -> dict:
    return {
        "envelope": {"sender": "system", "receiver": "router"},
        "context": {"original_input": original_input, "deadline": "", "tags": []},
        "payload": {},
        "history": ["System -> Router (Initial)"]
    }
