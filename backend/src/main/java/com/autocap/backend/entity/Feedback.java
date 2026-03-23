package com.autocap.backend.entity;

import com.autocap.backend.entity.enums.FeedbackStatus;
import com.autocap.backend.entity.enums.FeedbackType;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_feedback_user"))
    private User user;

    /**
     * Uses FeedbackTypeConverter (autoApply=true) to map multi-word DB values.
     * DB values: 'Bug Report' | 'Feature Request' | 'General' | 'Caption Quality'
     */
    @Column(length = 50, columnDefinition = "character varying")
    private FeedbackType type;

    @Column(length = 255)
    private String subject;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    /** Check constraint: rating >= 1 AND rating <= 5 */
    @Column
    private Integer rating;

    /**
     * Uses FeedbackStatusConverter (autoApply=true) to map multi-word DB values.
     * DB values: 'New' | 'In Review' | 'Resolved' | 'Won''t Fix'
     */
    @Column(length = 50, columnDefinition = "character varying")
    private FeedbackStatus status;

    @Column(name = "screenshot_url", columnDefinition = "text")
    private String screenshotUrl;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}
