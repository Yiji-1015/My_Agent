package com.ezagent.main_agent.dto;

import com.ezagent.main_agent.domain.SubTaskEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 프론트엔드와 주고받을 데이터 형식입니다.
 * Java 21의 'record'를 사용하면 롬복(@Getter, @Setter) 없이도 데이터를 담는 객체를 엄청 짧게 만들 수 있습니다!
 */
public class TaskDto {

    // 프론트에서 넘어오는 요청 (할 일 입력)
    public record TaskRequest(
            String originalInput,
            LocalDate deadline,
            List<String> attachments) {
    }

    // 프론트로 돌려보낼 응답 (분해 결과)
    public record TaskResponse(
            UUID taskId,
            List<SubTaskEntity> subtasks,
            String message) {
    }
}