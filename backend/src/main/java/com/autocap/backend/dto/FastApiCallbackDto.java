package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FastApiCallbackDto {
    private Long jobId;
    private String status;
    private List<CaptionResultDto> results;
    private String errorMessage;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CaptionResultDto {
        private Long imageId;
        private String captionText;
        private Double similarityScore;
        private Double bleu1;
        private Double bleu2;
        private Double bleu3;
        private Double bleu4;
        private Double meteor;
        private Double cider;
        private String modelName;
        private String modelVersion;
    }
}
