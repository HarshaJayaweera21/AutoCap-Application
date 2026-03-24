package com.autocap.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateDocRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Slug is required")
    private String slug;

    @NotBlank(message = "Content is required")
    private String content;

    private String endpoint;

    @NotNull(message = "Order index is required")
    private Integer orderIndex;

    @NotNull(message = "Category ID is required")
    private UUID categoryId;

    private List<UUID> tagIds;
}
