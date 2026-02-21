package com.autocap.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "captions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Caption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id", nullable = false, foreignKey = @ForeignKey(name = "fk_caption_image"))
    private Image image;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_caption_user"))
    private User user;

    @Column(name = "caption_text", nullable = false, columnDefinition = "text")
    private String captionText;

    @Column(name = "similarity_score")
    private Double similarityScore;

    @Column(name = "bleu_1")
    private Double bleu1;

    @Column(name = "bleu_2")
    private Double bleu2;

    @Column(name = "bleu_3")
    private Double bleu3;

    @Column(name = "bleu_4")
    private Double bleu4;

    @Column
    private Double meteor;

    @Column
    private Double cider;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @Column(name = "is_accepted")
    private Boolean isAccepted;

    @Column(name = "is_edited")
    private Boolean isEdited;

    @Column(name = "original_caption_text", columnDefinition = "text")
    private String originalCaptionText;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}
