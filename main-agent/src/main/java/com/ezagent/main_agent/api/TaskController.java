package com.ezagent.main_agent.api;

import com.ezagent.main_agent.dto.TaskDto.TaskRequest;
import com.ezagent.main_agent.dto.TaskDto.TaskResponse;
import com.ezagent.main_agent.orchestrator.TaskOrchestrator;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController // 이 클래스가 웹 API 요청을 받는 곳임을 알립니다.
@RequestMapping("/api/tasks") // 기본 주소를 "http://localhost:8080/api/tasks"로 설정합니다.
@RequiredArgsConstructor
public class TaskController {

    private final TaskOrchestrator orchestrator;

    // 프론트에서 POST 요청으로 할 일을 보내면 이 메서드가 실행됩니다.
    @PostMapping
    public TaskResponse createAndProcessTask(@RequestBody TaskRequest request) {
        // 입구에서는 아무 생각 없이 두뇌(Orchestrator)에게 일을 토스합니다!
        return orchestrator.processTask(request);
    }
}