from worker.envelope import AgentState

def task_analyzer_node(state: AgentState) -> dict:
    print("🧠 [Task Analyzer] 뭉뚱그려진 일을 서브태스크로 쪼갭니다...")
    
    context = state.get("context", {})
    task_input = context.get("original_input", "일반 태스크")
    
    payload = state.get("payload", {})
    
    # TODO: 여기에 LangChain과 OpenAI(GPT)를 연결해서 진짜 지능을 넣을 겁니다!
    mock_subtasks = [
        {"title": f"[AI 분해] '{task_input}' 관련 자료 수집", "estimated_min": 0},
        {"title": f"[AI 분해] '{task_input}' 초안 작성", "estimated_min": 0},
        {"title": f"[AI 분해] '{task_input}' 최종 검토", "estimated_min": 0}
    ]
    
    if "final_subtasks" not in payload:
        payload["final_subtasks"] = []
    
    payload["final_subtasks"].extend(mock_subtasks)
    
    envelope = state.get("envelope", {})
    envelope["sender"] = "task_analyzer"
    envelope["receiver"] = "time_estimator"
    
    print(f"   -> 🔪 {len(mock_subtasks)}개의 서브태스크로 분해 완료!")
    return {
        "envelope": envelope,
        "payload": payload,
        "history": ["task_analyzer finished dividing tasks"]
    }