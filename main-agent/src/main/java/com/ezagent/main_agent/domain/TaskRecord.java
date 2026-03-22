package com.ezagent.main_agent.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "task_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 200)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String originalInput;
    @Column(length = 20)
    private String status;
    private LocalDate deadline;
    @Column(length = 10)
    private String complexity;

    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<String> tags;

    @Column(columnDefinition = "TEXT")
    private String learnings;

    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "taskRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SubTaskEntity> subTasks = new ArrayList<>();

    public void addSubTask(SubTaskEntity subTask) {
        subTasks.add(subTask);
        subTask.setTaskRecord(this);
    }
}