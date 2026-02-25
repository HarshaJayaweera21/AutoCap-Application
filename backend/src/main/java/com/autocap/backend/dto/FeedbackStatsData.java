package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackStatsData {
    private Long total_count;
    private Double average_rating;
    private Map<String, Long> status_breakdown;
    private Map<String, Long> type_distribution;
}
