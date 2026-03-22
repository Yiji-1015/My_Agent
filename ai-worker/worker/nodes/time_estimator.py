from worker.envelope import AgentState

def time_estimator_node(state: AgentState) -> dict:
    print("⏱️ [Time Estimator] 쪼개진 일들의 소요 시간을 추정합니다...")
    
    payload = state.get("payload", {})
    subtasks = payload.get("final_subtasks", [])
    
    estimated_subtasks = []
    for i, task in enumerate(subtasks):
        if task.get("estimated_min", 0) <= 0:
            est_time = 30 if i == 0 else 60
            task["estimated_min"] = est_time
        estimated_subtasks.append(task)
        
    payload["final_subtasks"] = estimated_subtasks
    
    envelope = state.get("envelope", {})
    envelope["sender"] = "time_estimator"
    envelope["receiver"] = "done"
    
    print("   -> 🕒 모든 서브태스크에 예상 시간 부여 완료!")
    return {
        "envelope": envelope,
        "payload": payload,
        "history": ["time_estimator complete"]
    }