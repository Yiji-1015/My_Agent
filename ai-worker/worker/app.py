from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

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
    
    # TODO: 나중에 여기에 graph.py(LangGraph)를 연결해서 진짜 지능을 넣을 겁니다!
    # 일단은 자바 쪽이랑 통신 규격이 맞는지 가짜 데이터를 돌려보냅니다.
    
    fake_subtasks = [
        SubTask(title="1. 텍스트 맥락 분석 (Python이 쪼갬)", estimated_min=30),
        SubTask(title="2. 제안서 목차 작성 (Python이 쪼갬)", estimated_min=60)
    ]
    
    return AiResponse(
        route="default",
        subtasks=fake_subtasks,
        warnings=["이것은 파이썬이 만든 임시 데이터입니다."]
    )