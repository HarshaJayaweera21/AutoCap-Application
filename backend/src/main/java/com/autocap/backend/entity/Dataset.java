package com.autocap.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "datasets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dataset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dataset_user"))
    private User user;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Builder.Default
    @Column(name = "total_items")
    private Integer totalItems = 0;

    @Column(name = "average_similarity")
    private Double averageSimilarity;

    @Builder.Default
    @Column(name = "is_public")
    private Boolean isPublic = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "format")
    private String format;
}
