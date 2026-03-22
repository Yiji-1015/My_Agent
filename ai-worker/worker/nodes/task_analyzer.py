def task_analyzer_node(state: dict):
    print("🧠 [Task Analyzer] 뭉뚱그려진 일을 서브태스크로 쪼갭니다...")
    
    task_input = state.get("task_input", "")
    
    # TODO: 여기에 LangChain과 OpenAI(GPT)를 연결해서 진짜 지능을 넣을 겁니다!
    # "이 일을 3개로 쪼개줘"라고 프롬프트를 날리는 곳이죠.
    # 지금은 뼈대를 세우는 중이니, 파이썬이 똑똑하게 쪼갠 척(?) 하는 데이터를 넘겨줍니다.
    
    mock_subtasks = [
        {"title": f"[AI 분해] '{task_input}' 관련 자료 수집", "estimated_min": 0},
        {"title": f"[AI 분해] '{task_input}' 초안 작성", "estimated_min": 0},
        {"title": f"[AI 분해] '{task_input}' 최종 검토", "estimated_min": 0}
    ]
    
    print(f"   -> 🔪 {len(mock_subtasks)}개의 서브태스크로 분해 완료!")
    return {"final_subtasks": mock_subtasks}