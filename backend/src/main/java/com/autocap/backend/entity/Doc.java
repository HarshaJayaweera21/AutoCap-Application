package com.autocap.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "docs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Doc {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false, foreignKey = @ForeignKey(name = "fk_docs_category"))
    private DocCategory category;

    @Column(nullable = false, columnDefinition = "text")
    private String title;

    @Column(nullable = false, unique = true, columnDefinition = "text")
    private String slug;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(columnDefinition = "text")
    private String endpoint;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "is_published")
    private Boolean isPublished;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}
