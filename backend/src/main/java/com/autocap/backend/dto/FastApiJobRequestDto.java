package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FastApiJobRequestDto {

    private Long jobId;
    private Long userId;
    private String datasetName;
    private String datasetDescription;
    private String modelVariant;
    private Double temperature;
    private Integer maxLength;
    private Integer minLength;
    private Integer numBeams;
    private Double repetitionPenalty;
    private Double topP;
    private List<ImageDto> images;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageDto {
        private Long id;
        /** Public Supabase Storage URL for this image. */
        private String storageUrl;
    }
}
