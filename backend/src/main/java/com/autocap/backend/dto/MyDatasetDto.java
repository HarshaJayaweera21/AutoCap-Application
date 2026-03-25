package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyDatasetDto {
    private Long id;
    private String name;
    private String description;
    private Integer totalItems;
    private Double averageSimilarity;
    private Boolean isPublic;
    private String format;
    private OffsetDateTime createdAt;
}
