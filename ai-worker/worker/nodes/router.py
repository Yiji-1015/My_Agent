from worker.envelope import AgentState
from worker.plugins import route_map

def router_node(state: AgentState) -> dict:
    print("🚦 [Router] 태스크 유형을 분석합니다...")
    
    context = state.get("context", {})
    task_input = context.get("original_input", "")
    
    # route_map을 플러그인에서 불러옵니다. 키워드가 있으면 해당 플러그인으로 분기!
    chosen_analyzer = "task_analyzer" # 기본값
    
    for keyword, plugin_name in route_map.items():
        if keyword in task_input:
            print(f"   -> 🎯 '{keyword}' 키워드 감지! {plugin_name} 라우트로 빠집니다!")
            chosen_analyzer = plugin_name
            break
            
    if chosen_analyzer == "task_analyzer":
        print("   -> ➡️ 기본(일반) 태스크 분해 라우트로 직진합니다!")
        
    envelope = state.get("envelope", {})
    envelope["sender"] = "router"
    envelope["receiver"] = chosen_analyzer
    
    return {
        "envelope": envelope,
        "history": [f"Router decided -> {chosen_analyzer}"]
    }