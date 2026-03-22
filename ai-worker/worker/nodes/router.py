def router_node(state: dict):
    print("🚦 [Router] 태스크 유형을 분석합니다...")
    
    task_input = state.get("task_input", "")
    
    # 지금은 간단한 키워드로 길을 나누지만, 나중엔 LLM이 문맥을 보고 판단하게 할 겁니다!
    if "RFP" in task_input.upper() or "제안서" in task_input:
        print("   -> 📝 제안서(RFP) 전문 분석 라우트로 빠집니다!")
        return {"route_decision": "rfp"}
    else:
        print("   -> ➡️ 일반 태스크 분해 라우트로 직진합니다!")
        return {"route_decision": "default"}