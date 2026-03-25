package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicCaptionSearchDto {
    private Long captionId;
    private Long imageId;
    private String imageUrl;
    private String captionText;
    private Double similarityScore;
    private Boolean isFlagged;
    private Boolean isEdited;
}
