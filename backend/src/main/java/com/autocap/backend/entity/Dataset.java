package com.autocap.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "datasets", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dataset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "model_name")
    private String modelName;

    @Builder.Default
    @Column(name = "total_items")
    private Integer totalItems = 0;

    @Column(name = "average_similarity")
    private Double averageSimilarity;

    @Builder.Default
    @Column(name = "is_public")
    private Boolean isPublic = false;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "format")
    private String format;
}
