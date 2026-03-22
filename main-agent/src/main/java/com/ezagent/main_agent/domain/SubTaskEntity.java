package com.ezagent.main_agent.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sub_task")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubTaskEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_record_id")
    private TaskRecord taskRecord;

    @Column(length = 200)
    private String title;
    private Integer estimatedMin;
    private Integer actualMin;
    @Column(length = 20)
    private String status;
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;

    @Column(length = 200)
    private String outputRef; // 구글 캘린더, 노션 등의 ID 저장용
    @Column(length = 10)
    private String priority;
    private Integer sortOrder;
}