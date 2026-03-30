package com.autocap.backend.dto.admin;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Order index is required")
    @Min(value = 0, message = "Order must be 0 or greater")
    @Max(value = 99, message = "Order must be less than 100")
    private Integer orderIndex;
}
