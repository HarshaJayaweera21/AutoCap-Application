package com.autocap.backend.dto;

import lombok.Data;

@Data
public class DatasetUpdateRequest {
    private String name;
    private String description;
    private Boolean isPublic;
}
