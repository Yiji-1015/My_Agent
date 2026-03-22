package com.ezagent.main_agent.service;

import com.ezagent.main_agent.domain.SubTaskEntity;
import com.ezagent.main_agent.dto.TaskDto.TaskRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiClientService {

    // 스프링이 제공하는 마법의 인터넷 전화기입니다.
    private final RestTemplate restTemplate = new RestTemplate();
    
    // 파이썬 부서의 직통 번호 (엔드포인트)
    private final String AI_WORKER_URL = "http://localhost:8000/api/ai/process";

    public List<SubTaskEntity> process(TaskRequest request) {
        System.out.println("🚀 [AiClientService] 파이썬 AI 워커(8000)에 진짜 분석을 요청합니다!");

        // 1. 파이썬이 원하는 양식(JSON)에 맞춰서 포장하기
        Map<String, Object> aiRequest = Map.of(
            "task", request.originalInput(),
            "deadline", request.deadline() != null ? request.deadline().toString() : null,
            "user_profile", Map.of(),
            "related_past_tasks", List.of(),
            "attachments", request.attachments() != null ? request.attachments() : List.of()
        );

        // 2. 파이썬으로 슝! 쏘고 응답(Map) 받아오기
        Map<String, Object> response = restTemplate.postForObject(AI_WORKER_URL, aiRequest, Map.class);
        System.out.println("✅ [AiClientService] 파이썬으로부터 응답 도착!");

        // 3. 파이썬이 준 데이터를 자바 창고용 양식(SubTaskEntity)으로 다시 변환
        List<Map<String, Object>> subtasksData = (List<Map<String, Object>>) response.get("subtasks");
        List<SubTaskEntity> result = new ArrayList<>();

        int order = 1;
        for (Map<String, Object> data : subtasksData) {
            SubTaskEntity entity = new SubTaskEntity();
            entity.setTitle((String) data.get("title"));
            entity.setEstimatedMin((Integer) data.get("estimated_min"));
            entity.setSortOrder(order++);
            entity.setStatus("todo");
            result.add(entity);
        }

        return result;
    }
}