package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class DatasetIntelligenceResponse {

    // ── Row 1: Key Metrics ──
    private long totalCaptions;
    private long validatedCaptions;
    private long rejectedCaptions;
    private long totalDatasets;

    // Weekly change percentages (null means no prior data)
    private Double totalCaptionsChange;
    private Double validatedCaptionsChange;
    private Double rejectedCaptionsChange;
    private Double totalDatasetsChange;

    // ── Row 2: Captions per day ──
    private List<DailyCaptionCount> captionsPerDay;

    // ── Row 2: Validation rate (0–100) ──
    private double validationRate;

    // ── Row 3: Similarity statistics ──
    private Double avgSimilarity;
    private Double maxSimilarity;
    private Double minSimilarity;

    // ── Row 3: Similarity distribution ──
    private List<SimilarityBucket> similarityDistribution;

    @Getter
    @AllArgsConstructor
    public static class DailyCaptionCount {
        private String date;
        private long count;
    }

    @Getter
    @AllArgsConstructor
    public static class SimilarityBucket {
        private String range;
        private long count;
    }
}
