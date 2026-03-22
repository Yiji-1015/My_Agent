from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

from worker.graph import ai_brain
from worker.envelope import create_initial_envelope

# 자바가 보내는 요청(봉투) 양식
class AiRequest(BaseModel):
    task: str
    deadline: Optional[str] = None
    user_profile: Optional[dict] = None
    related_past_tasks: Optional[List[dict]] = []
    attachments: Optional[List[str]] = []

# 자바에게 돌려줄 응답(봉투) 양식
class SubTask(BaseModel):
    title: str
    estimated_min: int

class AiResponse(BaseModel):
    route: str
    subtasks: List[SubTask]
    warnings: List[str] = []

app = FastAPI()

@app.post("/api/ai/process", response_model=AiResponse)
async def process_task(request: AiRequest):
    """
    자바(Main Agent)가 호출하는 유일한 엔드포인트입니다.
    """
    print(f"📥 [Python AI] 자바로부터 업무 접수: {request.task}")
    
    # 1. 초기 봉투(Envelope) 생성
    initial_state = create_initial_envelope(request.task)
    
    # 2. LangGraph 오케스트레이터 실행
    print("🚀 LangGraph 오케스트레이션 엔진 가동!")
    final_state = ai_brain.invoke(initial_state)
    
    # 3. 결과 파싱 (Payload)
    envelope = final_state.get("envelope", {})
    payload = final_state.get("payload", {})
    history = final_state.get("history", [])
    
    print(f"✅ 오케스트레이션 완료! 거쳐간 노드: {len(history)}개")
    
    # 4. 자바에게 돌려줄 응답(SubTasks) 파싱
    final_subtasks = payload.get("final_subtasks", [])
    
    subtask_list = []
    for st in final_subtasks:
        subtask_list.append(SubTask(
            title=st.get("title", "알 수 없는 태스크"),
            estimated_min=st.get("estimated_min", 30)
        ))
    
    # 어떤 라우팅을 탔는지 식별
    route_used = history[1] if len(history) > 1 else "default"
    
    return AiResponse(
        route=route_used[-20:], # 간략히 표시
        subtasks=subtask_list,
        warnings=[f"실행 이력: {' ➡️ '.join(history)}"]
    )