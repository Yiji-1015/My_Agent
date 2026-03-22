# 🚀 EZ Agent (Agent Harness Designer v3)

EZ Agent는 사용자의 복잡한 대규모 태스크(RFP 분석, 학회 준비, 프로젝트 일정 수립 등)를 분석하고, 세부 서브 태스크로 논리적으로 분해하여 **최적의 일정을 스케줄링해주는 AI 기반 지능형 에이전트 시스템**입니다. 

플러그인 아키텍처와 독립적인 **Envelope(봉투) 패턴**을 활용하여 새로운 도메인과 로직을 손쉽게 연결할 수 있도록 설계된 Full-Stack (Python / Java / React) 기반의 최신 프로젝트입니다.

---

## ✨ 핵심 아키텍처 (Architecture)

본 시스템은 3개의 독립적인 모듈로 이루어져 있습니다. 데이터는 프론트엔드에서 취합되어 AI 파이프라인을 거친 후 알고리즘 엔진을 통해 시각화됩니다.

### 1. `ai-worker` (AI 기반 분석 파이프라인)
- **역할:** 사용자의 인풋을 분석하고, LangGraph 기반의 파이프라인을 통해 작업을 분류 및 분해합니다.
- **기술 스택:** Python, FastAPI, LangGraph
- **핵심 특징:**
  - **Envelope 패턴:** 멀티 에이전트 간의 통신은 항상 `envelope`, `context`, `payload`, `history`로 이루어진 일관된 표준 봉투(Envelope) 포맷을 사용합니다.
  - **플러그인 에이전트:** 새로운 도메인(예: 제안서 분석, 컨퍼런스 준비 분석) 추가 시 기존 코드의 변형 없이 플러그인 폴더에 템플릿만 복사하면 자동으로 라우팅 되도록 아키텍처링 되었습니다.

### 2. `main-agent` (스케줄링 알고리즘 백엔드 API)
- **역할:** AI Worker가 분석해 낸 서브태스크들을 넘겨받아 '마감일 역산 알고리즘(Backward Scheduling)' 및 '빈 시간 순차배치(Forward Scheduling)'를 통해 최적화된 스케줄을 제공합니다.
- **기술 스택:** Java 17+, Spring Boot, Spring Data JPA, H2 Database
- **핵심 특징:**
  - 로직 처리를 위한 REST API 엔드포인트 세트 제공 (`/api/tasks`, `/api/schedule/*`)
  - 확장성을 고려하여 외부 구글 캘린더 API 연동 기능 대비

### 3. `frontend` (직관적인 인터페이스 플랫폼)
- **역할:** 사용자로부터 초기 Task를 입력받고 (Task Input), 분석된 일정을 검토(Task Review)하며 통합 일정을 시각적으로 점검하는 Dashboard를 제공합니다.
- **기술 스택:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui

---

## 📦 핵심 설계 사상: Envelope 표준 규격

시스템의 가장 큰 핵심은 AI 에이전트의 페이로드를 규격화 한 **`Envelope`** 에 있습니다. 서로 다른 파이프라인(Task Analyzer → Time Estimator → Java API)을 거치면서도 파이프라인 자체를 수정할 필요 없이 봉투 내용물 만으로 동작하게 합니다.

```text
┌─────────────────────────────────┐
│ envelope: 보내는 사람, 받는 사람    │ ← 항상 일치하는 구조
│ context: 원본 요청, 마감일, 태그    │ ← 읽기 전용 기반 데이터
│ payload: 이 단계의 가공/실제 데이터  │ ← 에이전트 별 상이
│ history: 지금까지 수행 된 노드 기록  │ ← 계속 추가 됨
└─────────────────────────────────┘
```

---

## 📂 프로젝트 폴더 구조

```text
My_Agent/
├── ai-worker/         # [Port: 8000] LangGraph 에이전트 기반 Python 워커
│   ├── app.py         # FastAPI 엔트리 포인트
│   └── worker/
│       ├── nodes/     # router, task_analyzer, time_estimator 등 핵심 노드
│       └── plugins/   # 확장 가능한 도메인 Analyzer (템플릿 상주)
│
├── main-agent/        # [Port: 8080] Java Spring Boot 핵심 API 및 스케줄링 메커니즘
│   └── src/main/java/com/ezagent/main_agent/
│       ├── controller/   
│       ├── domain/       
│       └── service/      # Backward/Forward 스케줄러 포함
│
├── frontend/          # [Port: 5173] React + Vite + Tailwind UI 애플리케이션
│   ├── src/pages/     # Dashboard, TaskInput, TaskReview 
│   ├── src/components/# shadcn 기반 UI 등 
│   └── vite.config.ts # 초기 포트 충돌 방지를 위한 설정 내재
│
├── USAGE_GUIDE.md     # 플러그인 확장 방법에 대한 상세 매뉴얼
└── README.md          # Overview Document
```

---

## 🚀 빠른 시작 가이드 (Getting Started)

3개의 서비스를 모두 실행하여 EZ Agent의 완전한 파이프라인을 경험하실 수 있습니다.

### 1. 백엔드 알고리즘 서버 (Java/Spring) 실행
```bash
cd main-agent
./mvnw spring-boot:run
```
✅ **서버 포트**: `http://localhost:8080`

### 2. AI 분석 파이프라인 (Python/FastAPI) 실행
```bash
cd ai-worker
pip install -r requirements.txt
uvicorn worker.app:app --reload --port 8000
```
✅ **서버 포트**: `http://localhost:8000`

### 3. 화면 대시보드 (React/Vite) 실행
```bash
cd frontend
npm install
npm run dev
```
✅ **서버 포트**: `http://localhost:5173`

---

## 🛠 새로운 Analyzer(에이전트) 직접 추가하기

> **참고:** 보다 자세한 확장은 제공된 `USAGE_GUIDE.md` 를 읽어보시기 바랍니다. 

1. `ai-worker/worker/plugins/_template.py` 를 복사하여 분석하려는 테마에 맞게 기능 추가 (예: `conference_analyzer.py`)
2. 내부 `AGENT_CONFIG` 배열에 적절한 `route_keywords` 선언
3. `router.py` 의 `route_map` 에 딱 1줄 등록
4. **끝.** (이외의 스케줄러 알고리즘 로직이나 Time Estimation 로직은 손대지 않아도 완벽하게 연동됩니다.)
