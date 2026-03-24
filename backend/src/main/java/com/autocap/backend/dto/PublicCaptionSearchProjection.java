package com.autocap.backend.dto;

public interface PublicCaptionSearchProjection {
    Long getCaptionId();
    Long getImageId();
    String getOriginalName();
    String getCaptionText();
    Double getSimilarityScore();
    Boolean getIsFlagged();
}
