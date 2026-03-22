def time_estimator_node(state: dict):
    print("⏱️ [Time Estimator] 쪼개진 일들의 소요 시간을 추정합니다...")
    
    subtasks = state.get("final_subtasks", [])
    
    # TODO: 마찬가지로 나중에 LLM이 난이도를 보고 시간을 예측하게 만들 겁니다.
    # 지금은 기본값으로 30분, 60분을 배정해 봅니다.
    
    estimated_subtasks = []
    for i, task in enumerate(subtasks):
        # 첫 번째 일은 30분, 나머지는 60분으로 가짜 시간 부여
        est_time = 30 if i == 0 else 60
        task["estimated_min"] = est_time
        estimated_subtasks.append(task)
        
    print("   -> 🕒 모든 서브태스크에 예상 시간(estimated_min) 부여 완료!")
    return {"final_subtasks": estimated_subtasks}