package com.ezagent.main_agent.repository;

import com.ezagent.main_agent.domain.TaskRecord;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

@DataJpaTest // JPA(DB) 테스트를 위한 마법의 어노테이션! H2 메모리 DB를 띄우고 끝나면 싹 지워줍니다.
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TaskRecordRepositoryTest {

    @Autowired
    private TaskRecordRepository taskRecordRepository;

    @Test
    @DisplayName("EZ Agent - 새로운 태스크를 DB에 저장하고 상태로 검색할 수 있다")
    void saveAndFindByStatusTest() {

        // 1. Given (준비: 가짜 태스크 데이터 생성)
        TaskRecord task = TaskRecord.builder()
                .title("NIPA 사업 제안서 작성")
                .status("todo")
                .originalInput("NIPA 사업 또 나왔는데 제안서 써야 해. 마감 4/15")
                .createdAt(LocalDateTime.now())
                .build();

        // 2. When (실행: DB에 저장 후 'todo' 상태인 것만 조회)
        taskRecordRepository.save(task);
        List<TaskRecord> foundTasks = taskRecordRepository.findByStatus("todo");

        // 3. Then (검증: 저장한 데이터가 잘 찾아지는지 확인)
        assertThat(foundTasks).hasSize(1);
        assertThat(foundTasks.get(0).getTitle()).isEqualTo("NIPA 사업 제안서 작성");
        assertThat(foundTasks.get(0).getStatus()).isEqualTo("todo");
    }
}