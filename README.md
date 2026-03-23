# 🚀 EZ Agent (Agent Harness Designer v3)

**EZ Agent**는 사용자의 복잡한 대규모 태스크를 분석하고 서브 태스크로 분해하여 최적의 일정을 찾아주는 **AI 기반 지능형 에이전트 스케줄링 시스템**입니다. 

기존에 흩어져 있던 세 개의 가이드문서(기술 README, 동작원리 USAGE GUIDE, 초보자용 유치원생 가이드)를 하나로 통합한 **종합 안내서**입니다.

---

## 📐 전체 아키텍처 소개

EZ Agent는 확장성과 유연성을 극대화하기 위해 MSA(Microservices Architecture) 기반으로 설계되었습니다. React(프론트엔드), Java(오케스트레이터), Python(AI 워커) 3개의 핵심 모듈이 통일된 규격인 '표준 봉투(Envelope)'를 통해 통신합니다. 사용자의 자연어 요청은 오케스트레이터를 거쳐 최적의 AI 전문 플러그인으로 라우팅되며, 각 모듈은 독립적으로 동작하여 새로운 AI 비서를 손쉽게 확장할 수 있는 플러그인 아키텍처를 가집니다.

```mermaid
graph TD
    User([👨‍💻 사용자]) -->|1. 태스크 최초 요청 (자연어)| UI[💻 React Frontend<br/>TaskQueue: Port 5173]
    UI -->|2. 태스크 API 통신<br/>(표준 Envelope)| Orchestrator[⚙️ Java Main Agent<br/>Spring Boot: Port 8080]
    
    Orchestrator <-->|작업 상태 기록 / 반영| DB[(🗄️ Database)]
    Orchestrator -->|3. AI 작업 지시 및 분석 의뢰| AIWorker[🧠 Python AI Worker<br/>LangGraph: Port 8000]
    
    subgraph "Python AI Worker (의사결정 및 파이프라인)"
        AIWorker -->|Router를 통한 조건부 분기| Worker1(📝 RFP 분석기)
        AIWorker -->|Router를 통한 조건부 분기| Worker2(🗣️ 면접 분석기)
        AIWorker -->|Router를 통한 조건부 분기| WorkerN(💡 신규 플러그인...)
    end
    
    Worker1 -->|4. 서브 태스크 도출 및 응답 반환| Orchestrator
    Worker2 -->|4. 서브 태스크 도출 및 응답 반환| Orchestrator
    
    Orchestrator -->|5. 최종 스케줄링 조정 및 결과 반환| UI
    UI -->|6. 시각화된 파이프라인 결과 확인| User
```

---

## 🏥 1. 시스템 핵심 비유: "3인조 종합 병원"
아키텍처가 얼핏 복잡해 보이지만, 종합 병원의 분업 시스템을 떠올리면 매우 쉽습니다!

### 👩‍⚕️ 1) 총괄 매니저 / 데스크 간호사 (Java Main Agent, 포트 8080)
- **역할:** 사용자의 인풋을 최초로 접수받고, 과거 차트(DB)를 기록하며, 최종 스케줄링(캘린더 테트리스)을 조율합니다.
- **특징:** 혼자서 수술(AI 분석)을 하지는 않지만, 들어온 업무를 판단해 가장 적합한 AI 워커에게 배분하는 컨트롤 타워입니다.

### 🩺 2) 뇌수술 전문의 (Python AI Worker, 포트 8000)
- **역할:** 간호사(Java)가 보낸 서류를 바탕으로 LangGraph 파이프라인(AI)을 돌려 "이 작업은 3단계로 쪼개면 됩니다"라고 분석 결과를 반환합니다.
- **특징:** 예약(스케줄링)이나 프론트 화면은 신경 쓰지 않고 오직 'AI 추론'에만 집중합니다. 덕분에 면접 전문, 제안서 전문 등 새로운 AI 의사를 언제든 무한대로 꽂아 넣을 수 있는 '플러그인' 구조가 완성됩니다.

### 💻 3) 병원 키오스크 화면 (React Frontend, 포트 5173 / TaskQueue_Agent)
- **역할:** 환자(사용자)가 맨 처음 접수를 하고, 완성된 스케줄을 시각적으로 확인하는 창구입니다.

> 💡 **왜 굳이 이렇게 나누었나요 (MSA)?**  
> "그냥 파이썬 하나로 다 만들면 안 되나요?" 
> 처음엔 편하지만 나중에 챗봇 기능, 시각 분석 기능 등 수많은 AI 의사들을 추가할 때 시스템이 붕괴됩니다. Java라는 튼튼한 간호사(오케스트레이터)가 중간에서 교통정리를 해주기 때문에, 내일 당장 "웹 검색 전담 AI"를 추가해도 코드 한 줄 고장 없이 돌아갑니다!

---

## ✉️ 2. 핵심 설계 사상: '표준 봉투(Envelope)' 패스 규칙

부서들 간의 소통은 무조건 규격화된 **결재판(Envelope)**을 통해서만 이루어집니다.
```text
┌───────────────────────────────────────────────┐
│ envelope: 보내는 사람, 받는 사람 (송수신처)         │
│ context: 원본 요청, 마감일, 태그 (불변 데이터)       │
│ payload: 이 단계의 가공/실제 데이터 (태스크 목록)     │
│ history: 이 결재판을 거쳐간 부서들의 도장 기록       │
└───────────────────────────────────────────────┘
```
이 은쟁반(서류 양식) 구조 덕분에 AI 비서를 100명 더 뽑아도 파이프라인 시스템은 절대 고장 나지 않습니다.

---

## 🚀 3. 첫 통합 성공 사례: `TaskQueue_Agent` 연동 시나리오 

우리의 "종합 병원" 이론이 드디어 현실로 증명되었습니다! 첫 번째 통합 사례인 **TaskQueue 뷰 연동 시나리오**를 소개합니다.

**기본 상태:**
독립적으로 화면 구석에 겉돌고 있던 `TaskQueue_Agent` (단순한 React 컴포넌트)를 드디어 Main Agent(간호사)와 연결했습니다.

**동작 시나리오:**
1. 사용자가 키오스크(React TaskQueue 화면)에서 *"스타트업 지원사업 제안서(RFP) 써야 해"* 라고 입력하고 **[AI로 분해하기]** 버튼을 누릅니다.
2. 프론트엔드는 위에서 배운 **표준 봉투(Envelope)** 양식에 요청을 담아 Java 간호사(`API: /api/tasks`)에게 비동기로 던집니다.
3. Java 간호사는 "음, 제안서 전문 의사가 필요하겠어"라며 봉투를 Python 뇌수술 전문의(`ai-worker`)에게 토스합니다.
4. Python 뇌수술 전문의 중 `Router`가 쓱 보고 `rfp_analyzer` 방으로 환자를 분배(Conditional Edges)합니다.
5. 분석 결과를 꽉꽉 담아 봉투를 반환하면, Java 간호사가 스케줄 테트리스를 맞춰서 그 결과를 다시 키오스크(`TaskQueue` 화면)에 뿌려줍니다! 🎉

---

## 🛠 4. 기술 스택 및 빠른 시작 가이드 (Getting Started)

### 📂 프로젝트 폴더 구조
```text
My_Agent/
├── ai-worker/         # [Port: 8000] LangGraph 기반 Python 워커 (플러그인 상주)
├── main-agent/        # [Port: 8080] Java Spring Boot 핵심 API 및 스케줄러
└── frontend/          # [Port: 5173] React + Vite + Tailwind (TaskQueue 포함)
```

### 🎈 3개 서비스 동시 실행
3개의 창(터미널)을 열고 각각 실행해 주세요!
```bash
# 1. 백엔드 알고리즘 서버 (Java)
cd main-agent
./mvnw spring-boot:run

# 2. AI 분석 파이프라인 (Python)
cd ai-worker
uvicorn worker.app:app --reload --port 8000

# 3. 화면 대시보드 (React)
cd frontend
npm run dev
```

---

## 🧩 5. 확장 가이드: 새로운 비서(직원) 영입하기

새로운 기능(도메인)을 파이프라인 구조 변경 **단 한 줄 없이** 추가하는 방법입니다.

1. `ai-worker/worker/plugins/_template.py` 를 복사하여 분석하려는 테마에 맞게 기능 추가 (예: `interview_analyzer.py`)
2. 내부 `AGENT_CONFIG` 배열에 적절한 호출 키워드 선언:
   ```python
   AGENT_CONFIG = {
       "name": "interview_analyzer",           
       "route_keywords": ["면접", "인터뷰", "채용"], 
   }
   ```
3. `analyze()` 로직만 파이썬으로 잘 짜두고 서버를 재시작하면, Python 인사팀 장부에 자동 등록되어 끝!

---

## 🚨 6. 빙글빙글 트러블슈팅 (과거 에러 해결 모음)

혹시나 개발 중 에러가 나면 아래를 참고하세요!
1. **🚫 CORS Blocked 사건 (`WebConfig.java` 해결):** 자바 간호사가 프론트엔드 포트(5173, 8081 등)를 불법 복제 키오스크로 오해해서 내쫓았던 사건. 모든 로컬호스트 주소를 통과시키도록 허용(`allowedOriginPatterns`)하여 해결했습니다.
2. **📫 405 Method Not Allowed 사건 (프론트엔드 API 오타):** 프론트 우편배달부가 `api/tasks/process` 방이 아니라 빙빙 도는 `api/tasks` 주소로만 택배를 집어 던져서 생겼던 일. 주소를 정확히 기입하여 해결했습니다.
3. **💥 500 Internal Server Error & NullPointerException 사건:** 마감일(Deadline)이 없는 빈칸(null) 데이터가 오자, 자명한 데이터만 담을 수 있었던 자바 간호사(`Map.of`)가 기절했던 사건. 융통성 있는 헝겊 가방(`HashMap`)으로 코드를 교체하여 해결했습니다.
