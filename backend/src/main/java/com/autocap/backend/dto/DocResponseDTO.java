package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocResponseDTO {

    private UUID id;
    private String title;
    private String slug;
    private String content;
    private String endpoint;
    private Integer orderIndex;
    private UUID categoryId;
    private List<String> tags;
}
