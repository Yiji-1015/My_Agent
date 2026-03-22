package com.ezagent.main_agent.service;

import com.ezagent.main_agent.domain.TaskRecord;
import com.ezagent.main_agent.domain.SubTaskEntity;
import com.ezagent.main_agent.dto.TaskDto.TaskRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 아직 구현되지 않은 부서(Python 통신, 스케줄링 등)들의 가짜(Mock) 클래스 모음입니다.
 * 나중에 하나씩 진짜 로직으로 교체할 예정입니다!
 */
public class MockServices {

    @Service
    public static class TaskService {
        public TaskRecord create(TaskRequest request) {
            // DB에 저장하는 척하고 가짜 객체를 돌려줍니다.
            return TaskRecord.builder()
                    .id(UUID.randomUUID()) // 임시 UUID 생성
                    .originalInput(request.originalInput())
                    .status("todo")
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        public List<TaskRecord> findSimilar(String title) {
            return new ArrayList<>();
        }
    }

    @Service
    public static class AiClientService {
        public List<SubTaskEntity> process(TaskRequest request) {
            // Python AI를 다녀온 척하고 임시 서브태스크를 만들어 줍니다.
            return List.of(
                    SubTaskEntity.builder().title("가짜 AI가 쪼갠 첫 번째 일").estimatedMin(30).build(),
                    SubTaskEntity.builder().title("가짜 AI가 쪼갠 두 번째 일").estimatedMin(60).build());
        }
    }

    @Service
    public static class LogService {
        public void log(UUID taskId, String agent, String action) {
            System.out.println("[" + agent + "] " + action + " (태스크 ID: " + taskId + ")");
        }
    }
}