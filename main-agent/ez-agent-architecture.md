# EZ Agent — 개인 태스크 관리 에이전트 설계서

> **Java 메인 에이전트(두뇌) + Python AI 워커(감각기관)** 구조.
> 태스크를 접수하고, AI로 분석/분해하고, 상태를 관리하고, 과거 이력에서 학습하는 **범용 개인 태스크 관리 시스템**.
> 메인 에이전트가 오케스트레이션, DB, 상태 관리를 전부 담당하고,
> LLM이 필요한 순간에만 Python을 호출한다.
> 출력은 플러그인 방식으로 Google Calendar, Notion, Slack 등 자유롭게 확장 가능.

---

## 이 시스템은 무엇인가
핵심은 "태스크를 받아서 이해하고, 쪼개고, 관리하는 것"이다.

```
핵심 기능 (이 설계서가 다루는 것):
├── 태스크 접수 + 자연어 이해
├── 태스크 유형 자동 분류 (라우팅)
├── 도메인별 사전 분석 (RFP 등, 플러그인)
├── 서브태스크 분해 (복잡도 적응형)
├── 소요시간 추정
├── 일정 배치 알고리즘 (역산/순차)
├── 과거 이력 참조 + 학습 (교훈 기록)
├── 태스크 상태 관리 (todo → done 자동 전이)
└── 사용자 프로필 기반 개인화

출력 모듈 (갈아끼울 수 있음, 독립적):
├── Google Calendar ← 현재 구현 대상
├── Notion (나중에 추가 가능)
├── Slack 알림 (나중에 추가 가능)
├── Telegram 봇 (나중에 추가 가능)
└── 단순 대시보드만 (출력 모듈 없이도 동작)
```

---

## 아키텍처 개요

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   Main Agent (Java Spring Boot)                              │
│   ════════════════════════════════                            │
│   시스템의 두뇌. 모든 것이 여기서 시작하고 여기서 끝남.           │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│   │ Orchestrator │  │  DB (H2/     │  │  Scheduler   │      │
│   │ 전체 흐름 제어 │  │  PostgreSQL) │  │  알고리즘     │      │
│   └──────┬───────┘  │              │  └──────────────┘      │
│          │          │ - UserProfile│                         │
│          │          │ - TaskRecord │  ┌──────────────┐      │
│          │          │ - SubTask    │  │  Output       │      │
│          │          │ - SystemLog  │  │  Modules      │      │
│          │          └──────────────┘  │ (Calendar 등)  │      │
│          │                            └──────────────┘      │
│          │                                                   │
│          │  "LLM이 필요한 순간에만"                             │
│          │  HTTP POST → Python AI Worker                     │
│          │                                                   │
└──────────┼───────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  AI Worker (Python)                   │
│  ══════════════════                   │
│  LLM이 필요한 작업만 수행하고 반환.      │
│                                       │
│  ┌─────────┐                          │
│  │ Router  │ → 태스크 유형 분류         │
│  └────┬────┘                          │
│       ├─→ [RFP Analyzer]  (플러그인)   │
│       └─→ [직접 분해]                  │
│                                       │
│  ┌──────────────┐                     │
│  │Task Analyzer │ → 서브태스크 분해     │
│  └──────────────┘                     │
│  ┌──────────────┐                     │
│  │Time Estimator│ → 소요시간 추정      │
│  └──────────────┘                     │
│                                       │
│  LangGraph: 여기서만 돌아감             │
│  LangSmith: AI 판단 로그만 전송        │
│                                       │
│  → JSON 결과를 Main Agent에 반환       │
└──────────────────────────────────────┘
```

---

## 전체 흐름

```
[사용자] → [React 프론트] → [Java Main Agent] → 필요 시 → [Python AI Worker]
                                   │
                                   ├── 1. 태스크 접수 + DB 저장
                                   ├── 2. 과거 유사 태스크 검색
                                   ├── 3. Python에 분석/분해 요청 (컨텍스트 포함)
                                   ├── 4. Python 결과 수신 + 서브태스크 DB 저장
                                   ├── 5. 스케줄링 알고리즘 실행 (자체)
                                   ├── 6. 사용자 확인 대기
                                   ├── 7. 출력 모듈 실행 (Calendar 등록 등)
                                   └── 8. 태스크 상태 업데이트
```

### 상세 시퀀스

```
사용자: "NIPA 사업 또 나왔는데 제안서 써야 해. 마감 4/15"

[Java Main Agent]
  │
  ├─ 1. TaskRecord 생성 (status: todo)
  │
  ├─ 2. DB 검색: "NIPA" → 과거 TaskRecord 발견
  │     {
  │       title: "NIPA 공공AX 제안서",
  │       status: "done",
  │       completed_at: "2026-03-10",
  │       subtasks_summary: "현황분석, 기술방안 등 6개 섹션",
  │       learnings: "차장핑과 분담 시 섹션 인터페이스 먼저 맞출 것"
  │     }
  │
  ├─ 3. Python AI Worker 호출
  │     POST http://localhost:8000/api/ai/process
  │     body: {
  │       "task": "NIPA 사업 또 나왔는데 제안서 써야 해",
  │       "deadline": "2026-04-15",
  │       "user_profile": { ... },
  │       "related_past_tasks": [위에서 찾은 과거 태스크],
  │       "attachments": ["rfp.pdf"]
  │     }
  │
  ├─ 4. Python 결과 수신
  │     {
  │       "route": "rfp",
  │       "subtasks": [...],    ← 과거 이력 참고해서 더 정확한 분해
  │       "warnings": ["이전에 섹션 인터페이스 이슈 있었음"]
  │     }
  │
  ├─ 5. DB에 서브태스크 저장 + 스케줄링 알고리즘 실행 (Java 자체)
  │
  ├─ 6. 프론트에 배치 결과 반환 → 사용자 확인 대기
  │
  ├─ 7. 확인 후 출력 모듈 실행 (현재: Google Calendar 등록)
  │
  └─ 8. TaskRecord.status = "in_progress"
        (예정된 시간이 지나면 자동으로 "done")
```

---

## 디렉토리 구조

```
📁 ez-agent/
│
├── 📁 main-agent/                        ← Java (시스템의 두뇌)
│   ├── 📄 pom.xml
│   ├── 📁 src/main/java/com/ezagent/main_agent/
│   │   │
│   │   ├── 📁 orchestrator/              ← 오케스트레이터 (전체 흐름 제어)
│   │   │   ├── 📄 TaskOrchestrator.java  ← 메인 흐름: 접수→검색→AI호출→배치→출력
│   │   │   └── 📄 StatusManager.java     ← 태스크 상태 자동 전이 (todo→done)
│   │   │
│   │   ├── 📁 api/                       ← REST API
│   │   │   ├── 📄 TaskController.java    ← 프론트 → 태스크 접수/조회
│   │   │   ├── 📄 ScheduleController.java ← 배치 결과 조회/재배치
│   │   │   ├── 📄 ProfileController.java  ← 프로필 CRUD
│   │   │   └── 📄 DashboardController.java ← 대시보드 데이터
│   │   │
│   │   ├── 📁 domain/                    ← 도메인 모델 + DB 엔티티
│   │   │   ├── 📄 UserProfile.java       ← 사용자 프로필 (거의 안 변함)
│   │   │   ├── 📄 TaskRecord.java        ← 태스크 이력 + 상태
│   │   │   ├── 📄 SubTaskEntity.java     ← 서브태스크 (DB 저장용)
│   │   │   ├── 📄 ScheduleEntry.java     ← 배치 결과 (DB 저장용)
│   │   │   └── 📄 SystemLog.java         ← 시스템 로그
│   │   │
│   │   ├── 📁 repository/               ← JPA Repository
│   │   │   ├── 📄 TaskRecordRepository.java
│   │   │   ├── 📄 SubTaskRepository.java
│   │   │   └── 📄 SystemLogRepository.java
│   │   │
│   │   ├── 📁 service/                  ← 비즈니스 로직
│   │   │   ├── 📄 TaskService.java       ← 태스크 CRUD + 유사 태스크 검색
│   │   │   ├── 📄 AiClientService.java   ← Python AI Worker 호출
│   │   │   ├── 📄 ScheduleService.java   ← 스케줄링 오케스트레이션
│   │   │   ├── 📄 SlotFinderService.java ← 빈 시간 탐색
│   │   │   └── 📄 LogService.java        ← 시스템 로그 기록
│   │   │
│   │   ├── 📁 algorithm/                ← 스케줄링 알고리즘
│   │   │   ├── 📄 BackwardScheduler.java ← 마감일 역산
│   │   │   ├── 📄 ForwardScheduler.java  ← 빈 시간 순차 배치
│   │   │   └── 📄 EnergyOptimizer.java   ← 에너지 레벨 기반 최적화
│   │   │
│   │   ├── 📁 output/                   ← 출력 모듈 (플러그인 방식)
│   │   │   ├── 📄 OutputModule.java      ← 출력 모듈 공통 인터페이스
│   │   │   ├── 📄 CalendarOutputModule.java ← Google Calendar 출력
│   │   │   └── 📄 (NotionOutputModule.java) ← 나중에 추가
│   │   │
│   │   ├── 📁 scheduler/                ← 자동 상태 관리 (Spring Scheduler)
│   │   │   └── 📄 TaskStatusScheduler.java ← 완료 시간 지난 태스크 자동 done
│   │   │
│   │   └── 📁 config/
│   │       ├── 📄 GoogleCalendarConfig.java ← 출력 모듈용 (선택적)
│   │       ├── 📄 CorsConfig.java
│   │       └── 📄 DataSourceConfig.java
│   │
│   ├── 📁 src/main/resources/
│   │   ├── 📄 application.yml
│   │   └── 📄 schema.sql                ← DB 스키마 초기화
│   │
│   └── 📁 src/test/java/
│       ├── 📁 algorithm/
│       ├── 📁 orchestrator/
│       └── 📁 service/
│
├── 📁 ai-worker/                         ← Python (LLM이 필요할 때만)
│   ├── 📄 pyproject.toml
│   ├── 📄 .env                           ← LLM API 키, LangSmith 설정
│   ├── 📁 worker/
│   │   ├── 📄 app.py                    ← FastAPI 서버 (Java가 호출하는 엔드포인트)
│   │   ├── 📄 graph.py                  ← LangGraph 그래프 (내부 실행용)
│   │   │
│   │   ├── 📁 nodes/
│   │   │   ├── 📄 router.py             ← 태스크 유형 분류
│   │   │   ├── 📄 task_analyzer.py      ← 서브태스크 분해
│   │   │   └── 📄 time_estimator.py     ← 소요시간 추정
│   │   │
│   │   ├── 📁 plugins/                  ← 도메인별 분석 에이전트 (플러그인)
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 rfp_analyzer.py       ← RFP 분석
│   │   │   └── 📄 _template.py          ← 새 플러그인 템플릿
│   │   │
│   │   └── 📁 prompts/
│   │       ├── 📄 router.md
│   │       ├── 📄 task_analyzer.md
│   │       ├── 📄 time_estimator.md
│   │       └── 📄 rfp_analyzer.md
│   │
│   └── 📁 tests/
│
├── 📁 frontend/                          ← React
│   ├── 📄 package.json
│   ├── 📁 src/
│   │   ├── 📄 App.tsx
│   │   ├── 📁 pages/
│   │   │   ├── 📄 TaskInput.tsx          ← 할 일 입력 + 분해 결과
│   │   │   ├── 📄 TaskReview.tsx         ← 배치 결과 확인/수정
│   │   │   ├── 📄 Dashboard.tsx          ← 대시보드 + 이력 + 로그
│   │   │   └── 📄 Profile.tsx            ← 내 프로필 설정
│   │   ├── 📁 components/
│   │   │   ├── 📄 SubtaskCard.tsx
│   │   │   ├── 📄 WeeklyTimeline.tsx
│   │   │   ├── 📄 StatusBadge.tsx
│   │   │   └── 📄 PastTaskHint.tsx       ← "이전에 비슷한 일 했을 때..."
│   │   ├── 📁 api/
│   │   │   └── 📄 client.ts             ← Java API만 호출
│   │   └── 📁 types/
│   │       └── 📄 types.ts
│   └── 📄 tailwind.config.js
│
├── 📁 docs/
│   ├── 📄 architecture.md
│   └── 📄 envelope-spec.md
│
└── 📄 docker-compose.yml
    # services:
    #   main-agent:  Java  (port 8080) ← 모든 요청의 진입점
    #   ai-worker:   Python (port 8000) ← Java만 호출함
    #   frontend:    React  (port 3000) ← Java만 호출함
    #   db:          PostgreSQL (port 5432)
```

---

## Java Main Agent 상세

### DB 스키마

```sql
-- 사용자 프로필 (거의 안 변함)
CREATE TABLE user_profile (
    id          BIGINT PRIMARY KEY,
    name        VARCHAR(50),
    tech_stack  TEXT,           -- "Python, Java, LangGraph, RAG"
    work_hours  VARCHAR(20),   -- "09:00-18:00"
    lunch_break VARCHAR(20),   -- "12:00-13:00"
    preferences JSONB,         -- 기타 선호사항
    updated_at  TIMESTAMP
);

-- 태스크 이력 (계속 쌓임)
CREATE TABLE task_record (
    id              UUID PRIMARY KEY,
    title           VARCHAR(200),
    original_input  TEXT,
    status          VARCHAR(20),    -- todo, in_progress, done, archived
    deadline        DATE,
    complexity      VARCHAR(10),    -- 단순, 보통, 복잡
    tags            TEXT[],         -- {"nipa", "rfp", "proposal"}
    learnings       TEXT,           -- 이 태스크에서 배운 점 (완료 후 기록)
    created_at      TIMESTAMP,
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP
);

-- 서브태스크 (태스크별)
CREATE TABLE sub_task (
    id              UUID PRIMARY KEY,
    task_record_id  UUID REFERENCES task_record(id),
    title           VARCHAR(200),
    estimated_min   INT,
    actual_min      INT,           -- 실제 소요시간 (완료 후)
    status          VARCHAR(20),   -- todo, in_progress, done
    scheduled_start TIMESTAMP,
    scheduled_end   TIMESTAMP,
    output_ref      VARCHAR(200),  -- 출력 모듈 참조 (캘린더 이벤트 ID, Notion 페이지 ID 등)
    priority        VARCHAR(10),
    sort_order      INT
);

-- 시스템 로그 (Java 측 전체 로그)
CREATE TABLE system_log (
    id          BIGSERIAL PRIMARY KEY,
    task_id     UUID,
    agent       VARCHAR(50),    -- "orchestrator", "scheduler", "ai-worker", "output-module"
    action      VARCHAR(100),
    detail      JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### 출력 모듈 인터페이스

```java
/**
 * 출력 모듈의 공통 인터페이스.
 * 새로운 출력 채널(Notion, Slack 등)을 추가할 때 이 인터페이스를 구현한다.
 * 
 * 핵심 원칙: 태스크 관리 로직은 출력 모듈과 독립적이다.
 * 출력 모듈이 없어도 태스크 접수/분해/상태관리는 정상 동작한다.
 */
public interface OutputModule {

    /** 이 모듈의 이름 (로그용) */
    String getName();

    /** 서브태스크 목록을 외부 서비스에 내보낸다 */
    List<OutputResult> export(List<SubTaskEntity> subtasks, TaskRecord task);

    /** 외부 서비스의 상태를 읽어와 동기화한다 (선택) */
    default void sync(TaskRecord task) {}
}
```

```java
/**
 * Google Calendar 출력 모듈.
 * 서브태스크를 캘린더 이벤트로 등록한다.
 */
@Component
public class CalendarOutputModule implements OutputModule {

    @Override
    public String getName() { return "google-calendar"; }

    @Override
    public List<OutputResult> export(List<SubTaskEntity> subtasks, TaskRecord task) {
        // Google Calendar API로 이벤트 생성
        // 각 서브태스크의 output_ref에 이벤트 ID 저장
    }

    @Override
    public void sync(TaskRecord task) {
        // 캘린더 이벤트 상태를 읽어와 서브태스크 상태에 반영
    }
}
```

### TaskOrchestrator (메인 흐름 제어)

```java
/**
 * 시스템의 두뇌. 모든 태스크 처리 흐름을 제어한다.
 *
 * 이 클래스가 하는 일:
 * 1. 태스크 접수 → DB 저장
 * 2. 과거 유사 태스크 검색 (컨텍스트 확보)
 * 3. Python AI Worker에 분석/분해 요청 (컨텍스트 포함)
 * 4. AI 결과 수신 → 서브태스크 DB 저장
 * 5. 스케줄링 알고리즘 실행
 * 6. 사용자 확인 대기
 * 7. 출력 모듈 실행 (Calendar, Notion 등)
 * 8. 태스크 상태 업데이트
 *
 * 이 클래스가 하지 않는 일:
 * - 자연어 이해 (Python의 역할)
 * - 서브태스크 분해 (Python의 역할)
 * - LLM 호출 (절대 안 함)
 */

@Service
public class TaskOrchestrator {

    private final TaskService taskService;
    private final AiClientService aiClient;
    private final ScheduleService scheduleService;
    private final List<OutputModule> outputModules;  // 등록된 출력 모듈들
    private final LogService logService;

    /**
     * 메인 처리 흐름
     */
    public TaskResponse processTask(TaskRequest request) {

        // 1. 태스크 접수
        TaskRecord task = taskService.create(request);
        logService.log(task.getId(), "orchestrator", "태스크 접수",
            Map.of("title", task.getTitle()));

        // 2. 과거 유사 태스크 검색
        List<TaskRecord> pastTasks = taskService.findSimilar(
            task.getTitle(), task.getTags());
        logService.log(task.getId(), "orchestrator", "유사 태스크 검색",
            Map.of("found", pastTasks.size()));

        // 3. Python AI Worker 호출
        AiRequest aiRequest = AiRequest.builder()
            .task(task.getOriginalInput())
            .deadline(task.getDeadline())
            .userProfile(taskService.getUserProfile())
            .relatedPastTasks(pastTasks)
            .attachments(request.getAttachments())
            .build();

        AiResponse aiResponse = aiClient.process(aiRequest);
        logService.log(task.getId(), "orchestrator", "AI 분석 완료",
            Map.of("subtask_count", aiResponse.getSubtasks().size(),
                   "route", aiResponse.getRoute()));

        // 4. 서브태스크 DB 저장
        List<SubTaskEntity> subtasks = taskService.saveSubtasks(
            task.getId(), aiResponse.getSubtasks());

        // 5. 스케줄링 (Java 자체 실행)
        ScheduleResult schedule = scheduleService.calculate(
            subtasks, task.getDeadline());
        logService.log(task.getId(), "orchestrator", "스케줄링 완료",
            Map.of("warnings", schedule.getWarnings()));

        // 6. 사용자 확인용 결과 반환
        task.setStatus("pending_review");
        taskService.save(task);

        return TaskResponse.builder()
            .taskId(task.getId())
            .subtasks(subtasks)
            .schedule(schedule)
            .pastTaskHints(extractLearnings(pastTasks))
            .build();
    }

    /**
     * 사용자 확정 후 출력 모듈 실행
     */
    public ConfirmResponse confirmTask(UUID taskId) {

        List<SubTaskEntity> subtasks = taskService.getSubtasks(taskId);
        TaskRecord task = taskService.get(taskId);

        // 7. 등록된 모든 출력 모듈 실행
        for (OutputModule module : outputModules) {
            try {
                List<OutputResult> results = module.export(subtasks, task);
                logService.log(taskId, "output-module",
                    module.getName() + " 출력 완료",
                    Map.of("count", results.size()));
            } catch (Exception e) {
                logService.log(taskId, "output-module",
                    module.getName() + " 출력 실패",
                    Map.of("error", e.getMessage()));
            }
        }

        // 8. 상태 업데이트
        task.setStatus("in_progress");
        task.setStartedAt(LocalDateTime.now());
        taskService.save(task);

        return ConfirmResponse.of(subtasks);
    }
}
```

### AiClientService (Python 호출)

```java
/**
 * Python AI Worker를 호출하는 클라이언트.
 * Main Agent → Python 방향만 존재. Python이 Java를 호출하지 않는다.
 */

@Service
public class AiClientService {

    private final RestTemplate restTemplate;
    private final String aiWorkerUrl = "http://localhost:8000";

    /**
     * AI 분석/분해 요청
     *
     * Java가 보내는 것: 태스크 + 컨텍스트 (프로필, 과거이력)
     * Python이 돌려주는 것: 라우팅 결과 + 서브태스크 + 소요시간
     */
    public AiResponse process(AiRequest request) {
        try {
            ResponseEntity<AiResponse> response = restTemplate.postForEntity(
                aiWorkerUrl + "/api/ai/process",
                request,
                AiResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            // Python 다운 시 fallback — 시스템은 계속 동작
            log.error("AI Worker 호출 실패: {}", e.getMessage());
            throw new AiWorkerUnavailableException(
                "AI 서비스에 연결할 수 없습니다. 수동으로 서브태스크를 입력해주세요.");
        }
    }
}
```

### TaskStatusScheduler (자동 상태 관리)

```java
/**
 * 매시간 실행. 예정 시간이 지난 서브태스크를 자동으로 done 처리.
 * 모든 서브태스크가 done이면 태스크도 done으로 전이.
 */

@Component
public class TaskStatusScheduler {

    @Scheduled(cron = "0 0 * * * *")  // 매시간
    public void updateTaskStatuses() {

        // 1. 시간이 지난 서브태스크 → done
        List<SubTaskEntity> expired = subTaskRepo
            .findByStatusAndScheduledEndBefore("in_progress", LocalDateTime.now());
        expired.forEach(st -> st.setStatus("done"));
        subTaskRepo.saveAll(expired);

        // 2. 모든 서브태스크가 done인 태스크 → done
        List<TaskRecord> inProgress = taskRepo.findByStatus("in_progress");
        for (TaskRecord task : inProgress) {
            boolean allDone = taskRepo.areAllSubtasksDone(task.getId());
            if (allDone) {
                task.setStatus("done");
                task.setCompletedAt(LocalDateTime.now());
                taskRepo.save(task);
                logService.log(task.getId(), "scheduler", "태스크 자동 완료");
            }
        }
    }
}
```

### TaskService (유사 태스크 검색)

```java
/**
 * 과거 유사 태스크를 검색하여 AI에게 컨텍스트로 제공.
 * 이게 있으면 AI가 분해를 더 정확하게 한다.
 */

public List<TaskRecord> findSimilar(String title, List<String> tags) {
    // 1. 태그 기반 검색 (가장 정확)
    List<TaskRecord> byTags = taskRepo.findByTagsOverlap(tags);

    // 2. 제목 유사도 검색 (보조)
    List<TaskRecord> byTitle = taskRepo.findByTitleContaining(
        extractKeywords(title));

    // 3. 합치고 status=done 우선, 최근 순 정렬
    return merge(byTags, byTitle).stream()
        .filter(t -> t.getStatus().equals("done"))
        .sorted(Comparator.comparing(TaskRecord::getCompletedAt).reversed())
        .limit(3)
        .toList();
}
```

---

## Python AI Worker 상세

### FastAPI 엔드포인트 (Java가 호출하는 유일한 진입점)

```python
# ai-worker/worker/app.py
from fastapi import FastAPI
from worker.graph import run_ai_pipeline

app = FastAPI()

@app.post("/api/ai/process")
async def process_task(request: AiRequest) -> AiResponse:
    """
    Java Main Agent가 호출하는 유일한 엔드포인트.

    받는 것:
    - task: 원본 할 일 텍스트
    - deadline: 마감일
    - user_profile: 사용자 프로필
    - related_past_tasks: 과거 유사 태스크 (Java가 DB에서 검색해서 줌)
    - attachments: 첨부 파일 (RFP 등)

    돌려주는 것:
    - route: 어떤 분석기를 거쳤는지
    - subtasks: 분해된 서브태스크 + 소요시간
    - warnings: 주의사항
    """
    result = await run_ai_pipeline(
        task=request.task,
        deadline=request.deadline,
        user_profile=request.user_profile,
        past_tasks=request.related_past_tasks,
        attachments=request.attachments,
    )
    return AiResponse(**result)
```

### LangGraph (Python 내부에서만 돌아감)

```python
# ai-worker/worker/graph.py
from langgraph.graph import StateGraph, END

graph = StateGraph(AiWorkerState)

# 라우터
graph.add_node("router", router_node)

# 플러그인 (도메인 분석)
graph.add_node("rfp_analyzer", rfp_analyzer_node)

# 공통
graph.add_node("task_analyzer", task_analyzer_node)
graph.add_node("time_estimator", time_estimator_node)

# 진입점
graph.set_entry_point("router")

# 라우터 → 분기
graph.add_conditional_edges(
    "router",
    lambda s: s["route_decision"],
    {
        "rfp": "rfp_analyzer",
        "default": "task_analyzer",
    },
)

graph.add_edge("rfp_analyzer", "task_analyzer")
graph.add_edge("task_analyzer", "time_estimator")
graph.add_edge("time_estimator", END)  # ← Java에 결과 반환하고 끝

# Python은 "분석 결과"만 돌려주고, 스케줄링/출력은 Java가 알아서 한다.

app = graph.compile()

async def run_ai_pipeline(**kwargs) -> dict:
    state = build_initial_state(**kwargs)
    result = await app.ainvoke(state)
    return extract_response(result)
```

### task_analyzer 프롬프트 (과거 이력 활용)

```markdown
# Task Analyzer

## 입력 정보
- 원본 태스크: {task}
- 마감일: {deadline}
- 사용자 프로필: {user_profile}
- 과거 유사 태스크: {past_tasks}

## 과거 태스크 활용 규칙
과거에 비슷한 태스크를 수행한 이력이 있다면:
1. 이전 서브태스크 구조를 참고하되, 그대로 복사하지 않는다
2. learnings(교훈)이 있으면 이번 분해에 반영한다
3. 이전 실제 소요시간(actual_min)이 있으면 추정에 참고한다

예: 과거 NIPA 제안서에서 "섹션 인터페이스 먼저 맞출 것"이라는 교훈이 있으면
→ 이번에는 "섹션 구조 합의" 서브태스크를 앞쪽에 배치
```

---

## 로그 2종 구조

```
┌────────────────────────────────────────┐
│  시스템 로그 (Java DB - system_log)      │
│                                         │
│  - 태스크 접수/완료                       │
│  - 유사 태스크 검색 결과                   │
│  - AI Worker 호출/응답                   │
│  - 스케줄링 결과                          │
│  - 출력 모듈 실행 결과                    │
│  - 상태 자동 전이                         │
│                                         │
│  → 프론트 Dashboard에서 확인              │
│  → "태스크가 어디까지 진행됐지?"            │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  AI 판단 로그 (LangSmith)               │
│                                         │
│  - Router가 왜 이 유형으로 분류했는지      │
│  - Task Analyzer가 왜 이렇게 분해했는지    │
│  - Time Estimator가 왜 이 시간을 추정했는지│
│  - 프롬프트 입출력 전문                    │
│  - 토큰 사용량                           │
│                                         │
│  → LangSmith UI에서 확인                 │
│  → "AI 판단이 이상한데?" 할 때만 확인      │
└────────────────────────────────────────┘
```

---

## React 프론트엔드

**모든 API 호출은 Java Main Agent(8080)로만.** Python 직접 호출 안 함.

### 화면 구성 (AI에게 시킬 프롬프트)

#### TaskInput.tsx

```
React + TypeScript + Tailwind CSS로 할 일 입력 페이지를 만들어줘.

이 앱은 "개인 태스크 관리 에이전트"의 프론트엔드야.
할 일을 입력하면 AI가 서브태스크로 분해하고, 일정을 자동 배치해주는 시스템.

- 텍스트 입력 (할 일, placeholder: "할 일을 입력하세요")
- 날짜 피커 (마감일, 선택사항)
- 파일 첨부 (RFP 등 참고 문서, 선택사항)
- "분해하기" 버튼
- 결과: 서브태스크 카드 리스트 (제목, 소요시간, 우선순위 뱃지)
- 과거 유사 태스크가 있으면 상단에 힌트 표시:
  "💡 이전에 비슷한 일을 했어요: [제목] — 교훈: ..."
- "일정 배치하기" 버튼

API: POST http://localhost:8080/api/tasks
다크 모드, 모바일 반응형. 직접 코드 작성.
```

#### TaskReview.tsx

```
서브태스크 배치 결과를 리뷰하는 페이지.

- 주간 타임라인 뷰 (월~금, 09:00~18:00)
- 서브태스크 블록 (색상=우선순위: high=빨강, medium=노랑, low=초록)
- 블록 드래그로 시간 이동 가능
- 경고 배너 (빈 시간 부족 등)
- "확정하기" + "다시 배치" 버튼

API: POST http://localhost:8080/api/tasks/{id}/confirm
직접 코드 작성.
```

#### Dashboard.tsx

```
대시보드 페이지.

- 이번 주 태스크 수, 완료율, 다음 할 일
- 태스크 이력 리스트 (상태별 필터: 전체/진행중/완료)
  - 완료된 태스크에는 "교훈 기록" 버튼
- 시스템 로그 타임라인 (최근 활동)

API: GET http://localhost:8080/api/dashboard
직접 코드 작성.
```

#### Profile.tsx

```
프로필 설정 페이지.

- 이름, 기술 스택 (태그 입력)
- 업무 시간, 점심 시간 설정
- 기타 선호사항
- 저장 버튼

API: PUT http://localhost:8080/api/profile
직접 코드 작성.
```

---

## 태스크 라이프사이클

```
[todo] ──접수──→ [pending_review] ──배치 확인──→ [in_progress] ──자동──→ [done]
                     │                                              │
                     └──재배치──→ [pending_review]        사용자가 "교훈" 기록
                                                                    │
                                                               [archived]
                                                         (오래된 완료 태스크)
```

### 태스크 완료 시 교훈 기록

프론트 Dashboard에서 완료된 태스크의 "교훈 기록" 버튼:

```
API: PATCH http://localhost:8080/api/tasks/{id}/learnings
body: { "learnings": "차장핑과 분담 시 섹션 인터페이스 먼저 맞출 것" }
```

이게 다음번 유사 태스크에서 AI 컨텍스트로 제공됨.

---

## 구현 순서

```
Step 1: Java 도메인 모델 + DB 스키마
Step 2: Java 알고리즘 (BackwardScheduler, ForwardScheduler)
Step 3: Java API + TaskOrchestrator (Python 연동 부분은 mock)
Step 4: Python AI Worker (FastAPI + LangGraph)
Step 5: Java ↔ Python 연동 테스트
Step 6: Java TaskStatusScheduler (자동 상태 관리)
Step 7: Java 출력 모듈 (CalendarOutputModule)
Step 8: React 프론트엔드 (4개 화면)
Step 9: docker-compose + 통합 테스트
```

---

## 검증 체크리스트

- [ ] Java가 시스템 중심 (Python은 호출당하는 워커)
- [ ] Python에서 Java를 호출하지 않음
- [ ] 모든 DB 연산은 Java에서
- [ ] 과거 태스크 검색 → AI 컨텍스트로 전달됨
- [ ] 태스크 상태 자동 전이 (스케줄러)
- [ ] 완료 시 교훈 기록 가능
- [ ] 프론트는 Java API만 호출
- [ ] 시스템 로그(Java) + AI 로그(LangSmith) 분리
- [ ] Python 다운 시 에러 메시지 (시스템 전체 다운 아님)
- [ ] 출력 모듈이 없어도 핵심 기능(태스크 관리)은 동작
- [ ] 출력 모듈을 추가할 때 기존 코드 수정 불필요 (인터페이스 구현만)
