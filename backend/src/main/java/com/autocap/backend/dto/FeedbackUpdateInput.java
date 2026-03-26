package com.autocap.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Input DTO for updating an existing feedback entry by the user who created it.
 * All fields are optional for partial updates.
 */
@Data
public class FeedbackUpdateInput {

    /**
     * Must match the DB CHECK constraint values if provided.
     */
    @Pattern(regexp = "Bug Report|Feature Request|General|Caption Quality", message = "type must be one of: Bug Report, Feature Request, General, Caption Quality")
    private String type;

    @Size(max = 120, message = "subject must not exceed 120 characters")
    private String subject;

    private String message;

    @Min(value = 1, message = "rating must be at least 1")
    @Max(value = 5, message = "rating must be at most 5")
    private Integer rating;

    private String screenshot_url;
}
