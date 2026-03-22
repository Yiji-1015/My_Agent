package com.ezagent.main_agent.repository;

import com.ezagent.main_agent.domain.SubTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SubTaskRepository extends JpaRepository<SubTaskEntity, UUID> {
    // 자동 완료 스케줄러에서 사용할 쿼리 메서드
    List<SubTaskEntity> findByStatusAndScheduledEndBefore(String status, LocalDateTime time);
}