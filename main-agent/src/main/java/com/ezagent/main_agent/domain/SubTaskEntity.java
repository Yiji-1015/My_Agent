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

    private Integer estimatedMin; // AI가 추정한 시간
    private Integer actualMin; // 실제 소요된 시간 (나중에 사용자가 입력)

    @Column(length = 20)
    private String status; // todo, in_progress, done

    // 스케줄링 알고리즘이 채워줄 필드들
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;

    @Column(length = 200)
    private String outputRef; // 구글 캘린더 이벤트 ID 등

    @Column(length = 10)
    private String priority; // high, medium, low

    private Integer sortOrder; // 순서
}