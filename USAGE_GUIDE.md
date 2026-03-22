# Agent Harness Designer v3 — 사용 가이드

> 플러그인 아키텍처 + 표준 Envelope + Python/Java/React 풀스택

---

## v2 → v3 변경 요약

| | v2 | v3 |
|---|---|---|
| 에이전트 추가 | 코드 여러 곳 수정 | 플러그인 파일 1개 + Router 한 줄 |
| 데이터 전달 | 에이전트마다 다름 | **Envelope 표준** (봉투 형식) |
| 사전 분석 | 없음 | Router + 도메인 분석기 (RFP 등) |
| 프론트엔드 | Lovable만 | Lovable **or** React 직접 작성 |

---

## 핵심 개념: Envelope (봉투)

편지 봉투처럼, **모든 에이전트가 같은 형식의 봉투를 주고받는다.**
봉투 안의 내용물(payload)만 에이전트마다 다르고, 봉투 자체는 항상 동일.

```
┌─────────────────────────────────┐
│ envelope: 보내는 사람, 받는 사람    │ ← 항상 같은 구조
│ context: 원본 요청, 마감일, 태그   │ ← 읽기 전용, 수정 금지
│ payload: 이 단계의 실제 데이터     │ ← 에이전트마다 다름
│ history: 지금까지 누가 뭘 했는지   │ ← 계속 추가됨
└─────────────────────────────────┘
```

이게 왜 중요하냐면, 나중에 "학회 준비 분석기"든 "면접 준비 분석기"든
새 에이전트를 만들 때 이 봉투 형식만 맞추면 기존 파이프라인에 바로 끼워넣을 수 있어서.

---

## 새 에이전트 추가하는 법 (3단계)

예: "학회 준비 분석기"를 추가한다면

**Step 1**: `ai-agent/agent/plugins/_template.py`를 복사 → `conference_analyzer.py`

**Step 2**: 안에서 수정할 것:
```python
AGENT_CONFIG = {
    "name": "conference-analyzer",
    "route_keywords": ["학회", "컨퍼런스", "발표", "논문"],
}
```
그리고 `analyze()` 함수에 분석 로직 구현.

**Step 3**: `router.py`에 한 줄 추가:
```python
route_map["conference"] = "conference_analyzer"
```

끝. 나머지 파이프라인(task_analyzer → time_estimator → Java)은 수정 불필요.

---

## 구현 순서 (Step by Step)

### Step 1: Java 모델 + 알고리즘

GPT/Gemini에게:
```
아래 설계서의 Java 부분을 구현해줘.
Spring Boot 프로젝트로.

포함할 것:
1. Envelope.java (표준 봉투 모델)
2. SubTask.java, TimeSlot.java, ScheduleResult.java
3. BackwardScheduler.java (마감일 역산 알고리즘)
4. ForwardScheduler.java (빈 시간 순차 배치)
5. JUnit 단위 테스트

[설계서의 Java 알고리즘 부분 붙여넣기]
```

### Step 2: Java API 서버

```
Step 1의 알고리즘을 REST API로 감싸줘.
- POST /api/schedule/calculate
- GET /api/calendar/slots
- POST /api/calendar/create
- POST /api/tasks (프론트엔드 진입점)
- GET /api/tasks/summary

Google Calendar API 연동 포함.
CORS 설정: localhost:3000 허용.
```

### Step 3: Python Envelope + 플러그인 기반

```
아래 설계서를 기반으로 Python 프로젝트를 만들어줘.

1. envelope.py — Envelope 생성/검증 유틸
2. plugins/_template.py — 플러그인 템플릿
3. plugins/__init__.py — 플러그인 자동 로딩
4. state.py — LangGraph State (Envelope 기반)

[설계서의 Envelope 스펙 + 플러그인 템플릿 붙여넣기]
```

### Step 4: Python 공통 노드

```
LangGraph 노드를 구현해줘.
- router.py: 태스크 유형 분류 → 라우팅
- task_analyzer.py: 서브태스크 분해 (2가지 모드)
- time_estimator.py: 소요시간 추정
모두 Envelope 형식으로 입출력.

[설계서의 각 노드 정의 붙여넣기]
```

### Step 5: RFP Analyzer 플러그인

```
_template.py를 기반으로 rfp_analyzer.py를 만들어줘.
RFP 문서를 분석하여 제안서 구조를 추출하는 에이전트.

[설계서의 RFP Analyzer 정의 붙여넣기]
```

### Step 6: LangGraph 그래프 연결

```
모든 노드를 LangGraph 그래프로 연결해줘.
Router → 조건 분기 → 공통 파이프라인.
Tool Calling으로 Java API 호출.

[설계서의 그래프 정의 붙여넣기]
```

### Step 7: React 프론트엔드

```
React + TypeScript + Tailwind CSS로 3개 화면을 만들어줘.
Lovable이 아니라 직접 코드를 작성해줘.

[설계서의 React 프론트엔드 프롬프트 3개 붙여넣기]
```

### Step 8: docker-compose

```
아래 3개 서비스를 docker-compose로 묶어줘.
- ai-agent: Python (port 8000)
- scheduling-engine: Java Spring Boot (port 8080)
- frontend: React dev server (port 3000)
```

---

## 자원 분산 가이드

| Step | 추천 도구 | 이유 |
|------|---------|------|
| 1~2: Java | GPT 또는 Gemini | Java/Spring 코드 생성 잘 됨 |
| 3~6: Python | Claude | LangGraph 이해도 높음 |
| 7: React | Lovable 또는 GPT | UI 생성 특화 |
| 8: Docker | 아무거나 | 단순 설정 |

---

## FAQ

**Q: Envelope이 오버엔지니어링 아닌가?**
A: 에이전트가 2~3개면 맞음. 근데 이지가 "RFP 분석기" 추가하고 싶다고 했잖아.
앞으로 학회, 면접, 다른 도메인도 추가될 수 있고, 그때마다 기존 코드 건드리는 건 고통.
지금 봉투 규격 한 번 잡아두면 이후로는 플러그인만 만들면 됨.

**Q: Router가 잘못 분류하면?**
A: Router 프롬프트에서 "확신이 없으면 사용자에게 확인" 규칙이 있음.
그리고 route_keywords를 플러그인에서 자동 로딩하니까 키워드만 보강하면 됨.

**Q: analyzed_task 없이 task_analyzer에 바로 가면?**
A: 정상 동작. task_analyzer가 raw_input도 받을 수 있게 2가지 모드로 설계되어 있음.
"학회 예약"처럼 사전 분석 불필요한 건 Router → task_analyzer 직행.

**Q: Lovable 쓰고 싶으면?**
A: 설계서의 "React 프론트엔드" 프롬프트를 그대로 Lovable에 입력해도 됨.
API URL만 맞추면 동일하게 동작.
