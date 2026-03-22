---
name: agent-harness-designer
description: "AI 에이전트 하네스(멀티 에이전트 시스템)를 설계하고 구조화하는 스킬. 표준 인터페이스 기반의 플러그인 아키텍처로, 에이전트를 자유롭게 추가/제거할 수 있는 확장 가능한 시스템을 설계한다. Python(AI 레이어) + Java(확정 로직/API) + React(프론트엔드)를 기본 스택으로 지원한다. '에이전트 만들어줘', '멀티 에이전트 설계', '하네스 구조 잡아줘', 'AI 팀 구성', '에이전트 역할 정의', '스킬 파일 작성', '오케스트레이션 패턴', '에이전트 워크플로우', '새 에이전트 추가' 같은 요청에 반드시 이 스킬을 사용한다."
---

# Agent Harness Designer v3

에이전트 하네스를 **플러그인처럼 확장 가능하게** 설계하는 스킬.

핵심 가치: **표준 인터페이스로 에이전트를 끼웠다 뺐다 할 수 있게 하는 것.**

---

## 아키텍처 핵심: 표준 인터페이스

### 문제

에이전트를 추가할 때마다 입출력 구조가 달라지면:
- 새 에이전트 붙일 때마다 기존 코드 수정 필요
- 에이전트 간 데이터 전달이 깨짐
- 테스트/디버깅이 점점 어려워짐

### 해결: Universal Task Envelope

**모든 에이전트는 같은 봉투(Envelope) 형식으로 주고받는다.**

편지를 보낼 때 봉투 규격이 정해져 있으면 내용물이 뭐든 우체국이 배달할 수 있듯이,
에이전트 간 데이터도 "봉투"만 통일하면 내용물(payload)은 자유롭게 확장 가능하다.

```json
{
  "envelope": {
    "task_id": "uuid-1234",
    "source": "rfp-analyzer",
    "target": "task-analyzer",
    "timestamp": "2026-03-19T21:00:00Z",
    "version": "1.0"
  },
  "context": {
    "original_input": "NIPA RFP 분석해서 제안서 써야 해",
    "deadline": "2026-04-15",
    "tags": ["rfp", "proposal", "nipa"],
    "priority": "high",
    "metadata": {}
  },
  "payload": {
    "type": "analyzed_task",
    "data": { ... }
  },
  "history": [
    {
      "agent": "rfp-analyzer",
      "action": "RFP 문서 분석 완료",
      "timestamp": "2026-03-19T21:05:00Z"
    }
  ]
}
```

#### 봉투 구조 설명

| 필드 | 역할 | 비유 |
|------|------|------|
| `envelope` | 누가 → 누구에게 보내는지 | 봉투의 보내는 사람/받는 사람 |
| `context` | 원본 요청 + 전체 맥락 | 봉투 안 커버레터 (모든 에이전트가 참조) |
| `payload` | 이 단계의 실제 데이터 | 봉투 안 본문 (에이전트마다 다름) |
| `history` | 지금까지 누가 뭘 했는지 로그 | 봉투에 찍힌 우체국 도장들 |

#### payload.type 목록 (확장 가능)

| type | 설명 | 생성하는 에이전트 |
|------|------|----------------|
| `raw_input` | 사용자 원본 입력 | 시스템 (진입점) |
| `analyzed_task` | 분석 완료된 태스크 정보 | 도메인 분석기 (RFP, 학회 등) |
| `decomposed_subtasks` | 분해된 서브태스크 목록 | task-analyzer |
| `estimated_subtasks` | 소요시간이 추가된 서브태스크 | time-estimator |
| `scheduled_plan` | 캘린더 배치 계획 | schedule-planner (Java) |
| `calendar_events` | 등록된 캘린더 이벤트 | calendar-writer (Java) |

새로운 에이전트를 만들 때: payload.type만 새로 정의하면 된다.
기존 에이전트는 수정할 필요 없다.

---

## 에이전트 플러그인 구조

### 라우터 패턴: 태스크 유형에 따라 앞단 에이전트 선택

```
[사용자 입력]
      │
      ▼
┌─────────────────┐
│  Task Router    │  "이 태스크에 사전 분석이 필요한가?"
│  (Python LLM)   │
└────────┬────────┘
         │
    ┌────┴────────────┐
    │                 │
    ▼                 ▼
[사전 분석 불필요]   [사전 분석 필요]
    │                 │
    │            ┌────┴────────┐
    │            ▼             ▼
    │     [RFP Analyzer]  [다음에 추가할
    │            │         에이전트...]
    │            │
    └─────┬──────┘
          ▼
   [Task Analyzer]      ← 여기서부터는 공통 파이프라인
          │
   [Time Estimator]
          │
   [Schedule Planner]   ← Java Tool
          │
   [Human Review]
          │
   [Calendar Writer]    ← Java Tool
```

### 새 에이전트 추가하는 법 (플러그인 방식)

**Step 1**: 에이전트 정의 파일 작성 (표준 템플릿)
**Step 2**: payload.type 새로 정의
**Step 3**: Router에 분기 조건 추가
**Step 4**: 끝. 나머지 파이프라인은 수정 불필요.

예시: "학회 준비 분석기"를 추가한다면:

```python
# Router에 한 줄만 추가
route_map = {
    "rfp": "rfp_analyzer",
    "conference": "conference_analyzer",   # ← 이것만 추가
    "default": "task_analyzer",
}
```

---

## 기술 스택

```
┌─────────────────────────────────────────────────┐
│  AI 레이어 (Python)                               │
│  - LLM이 필요한 작업: 라우팅, 분석, 분해, 추론     │
│  - LangGraph / LangChain                         │
│  - 표준 Envelope 형식으로 입출력                   │
└────────────────────┬────────────────────────────┘
                     │ JSON (Tool Calling / REST API)
┌────────────────────▼────────────────────────────┐
│  확정 로직 레이어 (Java / Spring Boot)             │
│  - 알고리즘, 스케줄링, 날짜 계산, CRUD             │
│  - 표준 Envelope 형식으로 입출력                   │
│  - Google Calendar 연동                          │
└────────────────────┬────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────┐
│  프론트엔드 (React)                                │
│  - Lovable로 생성 가능, 또는 직접 코드 작성         │
│  - Java API 서버와 REST로 통신                    │
└─────────────────────────────────────────────────┘
```

### "이건 LLM? 코드?" 판단 기준

| 작업 성격 | 처리 주체 | 이유 |
|----------|---------|------|
| 자연어 이해/분류/라우팅 | Python + LLM | 사람 말을 해석해야 함 |
| 문서 분석 (RFP 등) | Python + LLM | 맥락 이해 + 구조 파악 |
| 창의적 분해/추정 | Python + LLM | 정해진 답이 없음 |
| 수치 계산/알고리즘 | Java 코드 | 같은 입력 → 같은 결과 |
| 날짜/시간 연산 | Java 코드 | LLM은 날짜 계산을 자주 틀림 |
| DB CRUD / API 연동 | Java (Spring Boot) | 트랜잭션 안정성 |
| UI | React | Lovable 생성 or 직접 코드 |

---

## 전체 워크플로우: 4단계

```
[1. 분석] → [2. 설계] → [3. 생성] → [4. 검증]
 목표 파악     패턴 선택    파일 작성    리뷰·디버깅
```

---

## Phase 1: 분석

사용자에게 아래 4칸 표를 채우도록 유도한다:

```
┌──────────┬──────────────────────────────────────┐
│  ① 목표  │ 최종적으로 뭘 자동화/생성하려는가?      │
│  ② 입력  │ 어디서 어떤 데이터를 읽는가?            │
│  ③ 처리  │ 어떤 계산/변환/판단을 하는가?           │
│  ④ 출력  │ 결과를 어디로/어떤 형태로 내보내는가?    │
└──────────┴──────────────────────────────────────┘
```

추가 질문:
- **사전 분석이 필요한가?** (RFP처럼 문서를 먼저 읽어야 하는지)
- LLM이 필요한 작업 vs 코드로 계산할 작업 분리
- 기존 에이전트 파이프라인에 끼워넣는 건지, 새로 만드는 건지
- 프론트엔드 필요 여부

---

## Phase 2: 설계 — 패턴 + 라우터 + 레이어

### 디자인 패턴 선택

(v2와 동일 — 파이프라인, 팬아웃/팬인, 전문가풀, 생성-검증, 계층적 위임)

### 라우터 필요 여부 판단

```
태스크 유형이 하나뿐인가?
├─ Yes → 라우터 불필요, 바로 파이프라인
└─ No  → 유형마다 사전 처리가 다른가?
          ├─ Yes → 라우터 + 도메인별 분석 에이전트
          └─ No  → 라우터 불필요 (공통 분석으로 충분)
```

### 레이어 배치

```
이 작업은 매번 같은 입력에 같은 결과여야 하는가?
├─ Yes → Java 확정 로직
└─ No  → Python + LLM
```

---

## Phase 3: 생성

### 3-1. 표준 에이전트 템플릿

**모든 에이전트는 이 템플릿을 따른다. 입출력은 반드시 Envelope 형식.**

```markdown
---
name: [영문-케밥-케이스]
description: "[한 줄 요약]"
layer: python-llm | java-logic
input_type: [받는 payload.type]
output_type: [내보내는 payload.type]
---

# [에이전트 이름] — [역할 한 줄 설명]

당신은 [구체적 페르소나]입니다.

## 입출력 인터페이스
- **Input**: payload.type == "[input_type]"
- **Output**: payload.type == "[output_type]"
- **Envelope**: context와 history는 그대로 전달하고, payload만 교체

## 핵심 역할
- [역할 1]
- [역할 2]

## 작업 원칙
1. [원칙 1] : [이유]
2. [원칙 2] : [이유]
3. **Envelope의 context는 수정하지 않는다** (읽기 전용)
4. **history에 자신의 작업 로그를 추가한다**

## 사용 가능 도구
- [도구1]: [용도]

## 제약 조건
- [금지사항]
- 수치/날짜 계산은 직접 하지 않는다 (해당 시)

## payload.data 출력 스키마
{
  [이 에이전트가 출력하는 JSON 구조]
}
```

### 3-2. 라우터 에이전트 템플릿

```markdown
---
name: task-router
description: "태스크 유형을 분류하고 적절한 분석 에이전트로 라우팅"
layer: python-llm
input_type: raw_input
output_type: (라우팅 — 직접 출력 없음)
---

# Task Router — 태스크 분류기

사용자 입력을 분석하여 사전 분석이 필요한지 판단하고,
적절한 에이전트로 라우팅합니다.

## 라우팅 규칙

| 태스크 유형 | 판단 기준 | 라우팅 대상 |
|-----------|---------|-----------|
| RFP/제안서 | RFP, 제안서, 공모, 입찰 키워드 | rfp-analyzer |
| (예비) 학회 | 학회, 컨퍼런스, 발표, 논문 | conference-analyzer |
| (예비) 취업 | 자소서, 면접, 지원 | job-prep-analyzer |
| 일반 | 위에 해당 안 됨 | task-analyzer (바로 분해) |

## 라우팅 시 규칙
- 원본 Envelope의 context를 그대로 유지
- history에 라우팅 판단 로그 추가
- 판단이 애매하면 사용자에게 확인
```

### 3-3. 도메인 분석 에이전트 예시: RFP Analyzer

```markdown
---
name: rfp-analyzer
description: "RFP 문서를 분석하여 제안서 작성을 위한 구조화된 정보를 추출"
layer: python-llm
input_type: raw_input
output_type: analyzed_task
---

# RFP Analyzer — RFP 분석 전문가

당신은 정부/공공 RFP를 분석하여 제안서 작성에 필요한 핵심 정보를
구조적으로 추출하는 전문가입니다.

## 입출력 인터페이스
- **Input**: 사용자 입력 + RFP 문서 (파일 또는 텍스트)
- **Output**: analyzed_task (제안서 구조 + 서브태스크 힌트)

## 핵심 역할
- RFP에서 사업 목적, 범위, 평가 기준, 필수 요구사항 추출
- 제안서에 필요한 섹션 구조 도출
- 각 섹션별 작업량/난이도 사전 판단
- task-analyzer가 분해하기 쉽도록 구조화된 정보 전달

## 워크플로우
1. RFP 문서에서 핵심 항목 추출
   - 사업명, 예산, 기간, 발주처
   - 필수 요구사항 목록
   - 평가 기준 및 배점
2. 제안서 섹션 구조 설계
   - 평가 기준에 맞춘 섹션 배치
   - 각 섹션의 예상 분량
3. 작업 힌트 생성
   - "현황분석"에는 시장 데이터 조사가 필요
   - "기술 방안"에는 아키텍처 설계가 필요
   - 이 힌트가 task-analyzer의 분해 품질을 높임

## 작업 원칙
1. RFP 원문의 용어를 그대로 사용 : 평가 기준과 매칭 필요
2. 누락 체크 : RFP 필수 요구사항이 제안서 구조에 빠지면 안 됨
3. 배점 비중 반영 : 배점 높은 항목에 더 많은 작업량 배분

## 제약 조건
- 제안서 본문을 직접 작성하지 않는다 (구조와 힌트만)
- 날짜/일정 계산은 하지 않는다

## payload.data 출력 스키마
{
  "rfp_summary": {
    "project_name": "사업명",
    "budget": "예산",
    "period": "사업 기간",
    "client": "발주처",
    "key_requirements": ["필수 요구사항 1", "..."],
    "evaluation_criteria": [
      { "item": "기술성", "weight": 60 },
      { "item": "가격", "weight": 40 }
    ]
  },
  "proposal_structure": [
    {
      "section": "현황분석",
      "estimated_pages": 5,
      "work_hints": ["시장 규모 데이터 조사", "경쟁 서비스 분석"],
      "difficulty": "medium"
    }
  ],
  "total_estimated_sections": 6,
  "suggested_subtask_count": 8
}
```

### 3-4. 프로젝트 디렉토리 구조

```
📁 task-calendar/
│
├── 📁 ai-agent/                         ← Python (AI 레이어)
│   ├── 📄 pyproject.toml
│   ├── 📄 .env
│   ├── 📁 agent/
│   │   ├── 📄 graph.py                  ← LangGraph 그래프 (라우터 포함)
│   │   ├── 📄 state.py                  ← State: Envelope 기반
│   │   ├── 📄 envelope.py              ← Envelope 생성/검증 유틸
│   │   │
│   │   ├── 📁 nodes/                    ← 에이전트 노드들
│   │   │   ├── 📄 router.py            ← 태스크 라우터
│   │   │   ├── 📄 task_analyzer.py     ← 공통: 서브태스크 분해
│   │   │   └── 📄 time_estimator.py    ← 공통: 소요시간 추정
│   │   │
│   │   ├── 📁 plugins/                  ← 도메인별 분석 에이전트 (플러그인)
│   │   │   ├── 📄 __init__.py          ← 플러그인 자동 로딩
│   │   │   ├── 📄 rfp_analyzer.py      ← RFP 분석
│   │   │   └── 📄 _template.py         ← 새 플러그인 만들 때 복사할 템플릿
│   │   │
│   │   ├── 📁 tools/                    ← Java API 호출 Tool
│   │   │   ├── 📄 schedule_tool.py
│   │   │   └── 📄 calendar_tool.py
│   │   │
│   │   └── 📁 prompts/                  ← 에이전트별 프롬프트
│   │       ├── 📄 router.md
│   │       ├── 📄 task_analyzer.md
│   │       ├── 📄 time_estimator.md
│   │       └── 📄 rfp_analyzer.md
│   │
│   └── 📁 tests/
│
├── 📁 scheduling-engine/                ← Java (Spring Boot)
│   ├── 📄 pom.xml
│   ├── 📁 src/main/java/com/taskcalendar/
│   │   ├── 📁 api/
│   │   │   ├── 📄 TaskController.java
│   │   │   ├── 📄 ScheduleController.java
│   │   │   └── 📄 CalendarController.java
│   │   ├── 📁 service/
│   │   │   ├── 📄 ScheduleService.java
│   │   │   ├── 📄 SlotFinderService.java
│   │   │   ├── 📄 CalendarSyncService.java
│   │   │   └── 📄 AgentClientService.java
│   │   ├── 📁 algorithm/
│   │   │   ├── 📄 BackwardScheduler.java
│   │   │   ├── 📄 ForwardScheduler.java
│   │   │   └── 📄 EnergyOptimizer.java
│   │   ├── 📁 model/
│   │   │   ├── 📄 Envelope.java        ← 표준 Envelope Java 모델
│   │   │   ├── 📄 SubTask.java
│   │   │   ├── 📄 TimeSlot.java
│   │   │   ├── 📄 ScheduleResult.java
│   │   │   └── 📄 CalendarEvent.java
│   │   └── 📁 config/
│   │       ├── 📄 GoogleCalendarConfig.java
│   │       └── 📄 CorsConfig.java
│   └── 📁 src/test/java/
│
├── 📁 frontend/                          ← React (Lovable 또는 직접 작성)
│   ├── 📄 package.json
│   ├── 📁 src/
│   │   ├── 📄 App.tsx                   ← 라우팅
│   │   ├── 📁 pages/
│   │   │   ├── 📄 TaskInput.tsx
│   │   │   ├── 📄 ScheduleReview.tsx
│   │   │   └── 📄 Dashboard.tsx
│   │   ├── 📁 components/
│   │   │   ├── 📄 SubtaskCard.tsx
│   │   │   ├── 📄 WeeklyTimeline.tsx
│   │   │   └── 📄 StatusBadge.tsx
│   │   ├── 📁 api/
│   │   │   └── 📄 client.ts
│   │   └── 📁 types/
│   │       ├── 📄 envelope.ts           ← Envelope TypeScript 타입
│   │       └── 📄 schedule.ts
│   └── 📄 tailwind.config.js
│
├── 📁 docs/                              ← 설계 문서
│   ├── 📄 architecture.md               ← 아키텍처 개요
│   ├── 📄 envelope-spec.md              ← Envelope 표준 스펙
│   └── 📄 plugin-guide.md              ← 새 에이전트 추가 가이드
│
└── 📄 docker-compose.yml
```

### 3-5. 플러그인 템플릿 (_template.py)

새 도메인 분석 에이전트를 추가할 때 이 파일을 복사해서 시작:

```python
"""
[에이전트 이름] 플러그인 템플릿

새 도메인 분석 에이전트를 만들 때:
1. 이 파일을 복사하여 이름 변경 (예: conference_analyzer.py)
2. AGENT_CONFIG 수정
3. analyze() 함수 구현
4. router.py의 route_map에 한 줄 추가
"""

AGENT_CONFIG = {
    "name": "your-analyzer",
    "description": "설명",
    "input_type": "raw_input",
    "output_type": "analyzed_task",
    "route_keywords": ["키워드1", "키워드2"],  # Router가 참조
}

def analyze(envelope: dict) -> dict:
    """
    표준 Envelope을 받아서 분석 결과를 Envelope에 담아 반환.

    규칙:
    - envelope["context"]는 읽기 전용 (수정 금지)
    - envelope["history"]에 자신의 로그 추가
    - envelope["payload"]만 교체
    """
    # 1. 입력 추출
    user_input = envelope["context"]["original_input"]
    metadata = envelope["context"]["metadata"]

    # 2. 분석 로직 (LLM 호출 등)
    analysis_result = _your_analysis_logic(user_input, metadata)

    # 3. Envelope 업데이트
    envelope["payload"] = {
        "type": AGENT_CONFIG["output_type"],
        "data": analysis_result
    }
    envelope["envelope"]["source"] = AGENT_CONFIG["name"]
    envelope["envelope"]["target"] = "task-analyzer"
    envelope["history"].append({
        "agent": AGENT_CONFIG["name"],
        "action": "분석 완료",
        "timestamp": _now()
    })

    return envelope
```

### 3-6. 오케스트레이터 템플릿

```markdown
# [프로젝트명] 오케스트레이터

## 기술 스택
- AI 레이어: Python + LangGraph
- 확정 로직: Java + Spring Boot
- 프론트엔드: React (Lovable 생성 or 직접)
- 통신: REST API (JSON, Envelope 형식)

## 에이전트 팀 구성
| 에이전트 | 레이어 | input_type | output_type |
|---------|--------|------------|-------------|
| router | Python LLM | raw_input | (라우팅) |
| rfp-analyzer | Python LLM (플러그인) | raw_input | analyzed_task |
| task-analyzer | Python LLM | analyzed_task 또는 raw_input | decomposed_subtasks |
| time-estimator | Python LLM | decomposed_subtasks | estimated_subtasks |
| schedule-planner | Java Tool | estimated_subtasks | scheduled_plan |
| calendar-writer | Java Tool | scheduled_plan | calendar_events |

## Envelope 흐름
raw_input → (router) → analyzed_task → decomposed_subtasks
→ estimated_subtasks → scheduled_plan → calendar_events

## API 인터페이스
| 엔드포인트 | 메서드 | 호출 방향 |
|-----------|--------|---------|
| /api/tasks | POST | Frontend → Java |
| /api/schedule/calculate | POST | Python → Java |
| /api/calendar/slots | GET | Python → Java |
| /api/calendar/create | POST | Python → Java |
| /api/tasks/summary | GET | Frontend → Java |

## 프론트엔드
Lovable 사용 가능. 미사용 시 React + Tailwind로 직접 작성.
(AI에게 시킬 때: "React + TypeScript + Tailwind로 만들어줘.
 Lovable이 아니라 직접 코드를 작성해줘." 라고 지시)
```

---

## Phase 4: 검증

### 설계 리뷰 체크리스트

**인터페이스 점검:**
- [ ] 모든 에이전트가 Envelope 형식을 지키는가?
- [ ] payload.type이 빠짐없이 정의되어 있는가?
- [ ] context는 읽기 전용으로 유지되는가?
- [ ] history에 로그가 쌓이고 있는가?

**확장성 점검:**
- [ ] 새 에이전트를 추가할 때 기존 코드 수정이 필요 없는가?
- [ ] Router에 분기 조건 한 줄만 추가하면 되는가?
- [ ] 플러그인 템플릿이 준비되어 있는가?

**레이어 점검:**
- [ ] LLM에게 수치/날짜 계산을 시키고 있지 않은가?
- [ ] Java Tool의 API 스펙이 Python Tool 정의와 일치하는가?
- [ ] 프론트엔드 → Java API 연결이 되는가? (CORS 포함)

### 에러 대응

| 증상 | 원인 | 해결 |
|------|------|------|
| 새 에이전트 추가 후 파이프라인 깨짐 | Envelope 형식 미준수 | output_type 확인 |
| Router가 엉뚱한 에이전트 선택 | 라우팅 키워드 부족 | route_keywords 보강 |
| 날짜 계산 틀림 | LLM이 직접 계산 | Java Tool로 전환 |
| payload.data 형식 불일치 | 스키마 불일치 | Envelope 스펙 문서 참조 |

---

## 참고

- `references/pattern-examples.md` — 패턴별 실전 예시
- `references/common-mistakes.md` — 자주 하는 설계 실수와 해결법
