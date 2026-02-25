package com.autocap.backend.dto;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class FeedbackDTO {
    private Long id;
    private Long user_id;
    private String type;
    private String subject;
    private String message;
    private Integer rating;
    private String status;
    private String screenshot_url;
    private OffsetDateTime created_at;
    private OffsetDateTime updated_at;
}