package com.autocap.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "images", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "original_name")
    private String originalName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "status")
    private String status;

    @Builder.Default
    @Column(name = "is_flagged")
    private Boolean isFlagged = false;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
