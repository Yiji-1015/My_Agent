package com.ezagent.main_agent.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "user_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String techStack;
    @Column(length = 20)
    private String workHours;
    @Column(length = 20)
    private String lunchBreak;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> preferences;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}