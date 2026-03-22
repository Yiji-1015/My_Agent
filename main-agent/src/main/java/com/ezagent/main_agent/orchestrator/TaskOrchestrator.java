package com.ezagent.main_agent.orchestrator;

import com.ezagent.main_agent.domain.SubTaskEntity;
import com.ezagent.main_agent.domain.TaskRecord;
import com.ezagent.main_agent.dto.TaskDto.TaskRequest;
import com.ezagent.main_agent.dto.TaskDto.TaskResponse;

import com.ezagent.main_agent.service.AiClientService; // ⭐️ 우리가 새로 만든 진짜 파이썬 통신병!
import com.ezagent.main_agent.service.MockServices.LogService; // (아직 가짜가 필요함)
import com.ezagent.main_agent.service.MockServices.TaskService; // (아직 가짜가 필요함)
import com.ezagent.main_agent.service.ScheduleService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class TaskOrchestrator {

    private final TaskService taskService;
    private final AiClientService aiClient;
    private final LogService logService;
    private final ScheduleService scheduleService;

    public CompletableFuture<TaskResponse> processTask(TaskRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            // 1. 태스크 접수
            TaskRecord task = taskService.create(request);
            logService.log(task.getId(), "orchestrator", "태스크 접수 완료");

            // 2. 과거 유사 태스크 검색
            taskService.findSimilar(request.originalInput());

            // 3. ⭐️ 진짜 Python AI Worker 호출 및 결과 수신! ⭐️
            List<SubTaskEntity> subtasks = aiClient.process(request);
            logService.log(task.getId(), "orchestrator", "AI 분석 및 서브태스크 분해 완료 (진짜 Python!)");

            // 4. 스케줄링 엔진 가동
            scheduleService.assignTimeSlots(task, subtasks);
            logService.log(task.getId(), "orchestrator", "달력 스케줄링(테트리스) 완료");

            // 5. 상태 변경
            task.setStatus("pending_review");

            return new TaskResponse(task.getId(), subtasks, "AI 분해 및 스케줄링 성공! (Java 비동기 <-> Python 도킹 완료!)");
        });
    }
}