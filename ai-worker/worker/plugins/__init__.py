import importlib
import pkgutil
import os

# 각 플러그인 모듈에서 추출된 정보를 담아 graph.py로 전달합니다.
route_map = {}
plugin_nodes = {}

current_dir = os.path.dirname(__file__)

# 현재 폴더 안의 모든 파이썬 파일(_template 등)을 스캔합니다.
for _, module_name, is_pkg in pkgutil.iter_modules([current_dir]):
    if is_pkg or module_name == "__init__":
        continue
        
    try:
        module = importlib.import_module(f"worker.plugins.{module_name}")
        
        # AGENT_CONFIG와 analyze 함수가 있어야 유효한 플러그인으로 인정!
        if hasattr(module, "AGENT_CONFIG") and hasattr(module, "analyze"):
            config = module.AGENT_CONFIG
            node_name = config.get("name", module_name)
            
            # 노드로 등록
            plugin_nodes[node_name] = module.analyze
            
            # 라우팅 키워드 매핑
            for kw in config.get("route_keywords", []):
                route_map[kw] = node_name
                
    except Exception as e:
        print(f"⚠️ [Plugin Loader] {module_name} 모듈 로드 오류: {e}")
