package com.autocap.backend.entity;

import com.autocap.backend.entity.enums.FlagStatus;
import com.autocap.backend.entity.enums.ImageStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_image_user"))
    private User user;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "original_name")
    private String originalName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column
    private Integer width;

    @Column
    private Integer height;

    /** Maps check constraint: 'uploaded'|'processing'|'completed'|'failed' */
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "character varying")
    private ImageStatus status;

    @Column(name = "is_flagged")
    private Boolean isFlagged;

    /** Maps check constraint: 'Clean'|'Flagged'|'Rejected' */
    @Enumerated(EnumType.STRING)
    @Column(name = "flag_status", columnDefinition = "character varying")
    private FlagStatus flagStatus;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
