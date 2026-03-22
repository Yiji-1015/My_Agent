package com.ezagent.main_agent.repository;

import com.ezagent.main_agent.domain.TaskRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface TaskRecordRepository extends JpaRepository<TaskRecord, UUID> {

    List<TaskRecord> findByStatus(String status);

    List<TaskRecord> findByTitleContaining(String keyword);

    // 모든 서브태스크가 'done'인지 확인하는 로직
    @Query("SELECT CASE WHEN COUNT(s) > 0 AND SUM(CASE WHEN s.status = 'done' THEN 1 ELSE 0 END) = COUNT(s) THEN true ELSE false END "
            +
            "FROM SubTaskEntity s WHERE s.taskRecord.id = :taskId")
    boolean areAllSubtasksDone(@Param("taskId") UUID taskId);

    @Query(value = "SELECT * FROM task_record", nativeQuery = true)
    List<TaskRecord> findByTagsOverlap(@Param("tags") List<String> tags);
}