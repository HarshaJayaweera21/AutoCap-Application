package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentDatasetDto {
    private Long id;
    private String name;
    private String modelName;
    private Integer totalItems;
    private Double averageSimilarity;
    private OffsetDateTime createdAt;
}
