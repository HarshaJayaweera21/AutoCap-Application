package com.autocap.backend.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Input DTO for admin status updates on feedback.
 * Validated against the Supabase 'feedback' table CHECK constraint on 'status'.
 */
@Data
public class FeedbackAdminUpdateInput {

    @Pattern(regexp = "New|In Review|Resolved|Won't Fix", message = "status must be one of: New, In Review, Resolved, Won't Fix")
    private String status;
}
