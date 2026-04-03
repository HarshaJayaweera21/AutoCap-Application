package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportStatusDto {
    private String jobId;
    private String status;
    private int progress;
    private String message;
    private boolean downloadReady;
}
