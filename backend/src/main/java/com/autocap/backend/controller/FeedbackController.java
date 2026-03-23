package com.autocap.backend.controller;

import com.autocap.backend.dto.FeedbackCreateInput;
import com.autocap.backend.dto.FeedbackDTO;
import com.autocap.backend.service.FeedbackService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for user-facing feedback operations.
 *
 * POST /feedback — Submit new feedback (requires X-User-Id header)
 * GET /feedback — List all feedback (filterable)
 * GET /feedback/{id} — Get a specific feedback entry
 *
 * The caller MUST pass the authenticated user's database ID via the
 * "X-User-Id" header, because user_id is NOT NULL in the DB schema.
 */
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    /**
     * Create a new feedback entry.
     *
     * Header X-User-Id (required) — the DB user id of the submitter
     * Body FeedbackCreateInput (validated)
     */
    @PostMapping({ "", "/" })
    public ResponseEntity<?> createFeedback(
            @Valid @RequestBody FeedbackCreateInput input,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {

        // user_id is NOT NULL in the DB — reject early with a clear error
        if (userId == null || userId <= 0) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "X-User-Id header is required and must be a valid user id"));
        }

        FeedbackDTO created = feedbackService.createFeedback(input, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * List all feedback entries, with optional filters.
     *
     * @param type   filter by type (e.g. "Bug Report")
     * @param status filter by status (e.g. "New")
     * @param search keyword search across subject and message
     * @param skip   pagination offset (default 0)
     * @param limit  max results (default 20)
     */
    @GetMapping({ "", "/" })
    public ResponseEntity<List<FeedbackDTO>> getAllFeedback(
            @RequestParam(required = false) String type,
            @RequestParam(value = "feedback_status", required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "20") int limit) {

        List<FeedbackDTO> feedbacks = feedbackService.getAllFeedback(type, status, search, skip, limit);
        return ResponseEntity.ok(feedbacks);
    }

    /**
     * Get a single feedback entry by its ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getFeedbackById(@PathVariable Long id) {
        try {
            FeedbackDTO feedback = feedbackService.getFeedbackById(id);
            return ResponseEntity.ok(feedback);
        } catch (EntityNotFoundException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}