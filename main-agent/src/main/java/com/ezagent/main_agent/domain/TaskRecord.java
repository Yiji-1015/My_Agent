package com.ezagent.main_agent.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
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
    private String status; // todo, pending_review, in_progress, done, archived

    private LocalDate deadline;

    @Column(length = 10)
    private String complexity; // simple, normal, complex

    // PostgreSQL의 Array 타입 처리나 쉼표 기반 String 처리가 필요함
    @Column(columnDefinition = "TEXT")
    private String tags; // 예: "nipa,rfp,proposal"

    @Column(columnDefinition = "TEXT")
    private String learnings; // 완료 후 남길 교훈

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    // 양방향 매핑 (오케스트레이터에서 서브태스크를 쉽게 가져오기 위함)
    @OneToMany(mappedBy = "taskRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SubTaskEntity> subTasks = new ArrayList<>();
}