package com.autocap.backend.controller;

import com.autocap.backend.dto.FeedbackAdminUpdateInput;
import com.autocap.backend.dto.FeedbackDTO;
import com.autocap.backend.dto.FeedbackStatsData;
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
 * Admin REST controller for managing feedback entries.
 *
 * GET /admin/feedback — List all feedback (filterable by type, status, search)
 * PATCH /admin/feedback/{id} — Update status of a feedback entry
 * DELETE /admin/feedback/{id} — Delete a feedback entry
 * GET /admin/feedback/stats/dashboard — Aggregated feedback statistics
 */
@RestController
@RequestMapping("/admin/feedback")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000" }, allowCredentials = "true")
public class AdminFeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    /**
     * List all feedback with optional type, status, and keyword search filters.
     */
    @GetMapping({ "", "/" })
    public ResponseEntity<List<FeedbackDTO>> getAdminFeedback(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "50") int limit) {

        List<FeedbackDTO> feedbacks = feedbackService.getAllFeedback(type, status, search, skip, limit);
        return ResponseEntity.ok(feedbacks);
    }

    /**
     * Update the status of a feedback entry.
     * Accepted values: "New", "In Review", "Resolved", "Won't Fix"
     */
    @PatchMapping("/{id}")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackAdminUpdateInput input) {

        try {
            FeedbackDTO updated = feedbackService.updateStatus(id, input);
            return ResponseEntity.ok(updated);
        } catch (EntityNotFoundException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get aggregated stats: total count, average rating, status breakdown, type
     * distribution.
     */
    @GetMapping("/stats/dashboard")
    public ResponseEntity<FeedbackStatsData> getStats() {
        FeedbackStatsData stats = feedbackService.getFeedbackStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Permanently delete a feedback entry.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFeedback(@PathVariable Long id) {
        try {
            feedbackService.deleteFeedback(id);
            return ResponseEntity.noContent().build(); // 204 No Content
        } catch (EntityNotFoundException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
