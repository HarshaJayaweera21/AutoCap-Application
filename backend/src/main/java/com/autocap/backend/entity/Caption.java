package com.autocap.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "captions", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Caption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id", nullable = false)
    private Image image;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "caption_text", nullable = false)
    private String captionText;

    @Column(name = "similarity_score")
    private Double similarityScore;

    @Column(name = "model_name")
    private String modelName;

    @Column(name = "model_version")
    private String modelVersion;

    @Builder.Default
    @Column(name = "is_accepted")
    private Boolean isAccepted = false;

    @Builder.Default
    @Column(name = "is_edited")
    private Boolean isEdited = false;

    @Column(name = "original_caption_text", columnDefinition = "text")
    private String originalCaptionText;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "image_url")
    private String imageUrl;
}
