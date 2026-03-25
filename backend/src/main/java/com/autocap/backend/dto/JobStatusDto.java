package com.autocap.backend.dto;

import com.autocap.backend.entity.enums.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobStatusDto {
    private Long jobId;
    private JobStatus status;
    private int processedCount;
    private int totalCount;
    private String errorMessage;
    private Long datasetId;

    // Dataset Configuration stored in-memory during processing
    private com.autocap.backend.entity.User user;
    private String datasetName;
    private String datasetDescription;
    private String modelName;
}
