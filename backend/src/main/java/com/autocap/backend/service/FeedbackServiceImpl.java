package com.autocap.backend.service;

import com.autocap.backend.dto.FeedbackAdminUpdateInput;
import com.autocap.backend.dto.FeedbackCreateInput;
import com.autocap.backend.dto.FeedbackDTO;
import com.autocap.backend.dto.FeedbackStatsData;
import com.autocap.backend.entity.Feedback;
import com.autocap.backend.repository.FeedbackRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class FeedbackServiceImpl implements FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Override
    public FeedbackDTO createFeedback(FeedbackCreateInput input, Long userId) {
        Feedback feedback = new Feedback();

        // userId may be null (anonymous), which is allowed — the DB column is
        // nullable-friendly
        // but we only persist it if it's valid (not 0, which would violate FK)
        if (userId != null && userId > 0) {
            feedback.setUserId(userId);
        }

        feedback.setType(input.getType() != null ? input.getType() : "General");
        feedback.setSubject(input.getSubject());
        feedback.setMessage(input.getMessage());
        feedback.setRating(input.getRating());
        feedback.setScreenshotUrl(input.getScreenshot_url());
        feedback.setStatus("New"); // Always start as New

        Feedback saved = feedbackRepository.save(feedback);
        return convertToDTO(saved);
    }

    @Override
    public List<FeedbackDTO> getAllFeedback(String type, String status, String search, int skip, int limit) {
        // Use DB-level filtering via JPQL — avoids loading all rows into memory
        // Pass null for empty strings so the JPQL IS NULL check works correctly
        String typeFilter = (type != null && !type.isBlank()) ? type : null;
        String statusFilter = (status != null && !status.isBlank()) ? status : null;
        String searchFilter = (search != null && !search.isBlank()) ? search : null;

        List<Feedback> results = feedbackRepository.findFiltered(typeFilter, statusFilter, searchFilter);

        // Apply pagination in-memory (after JPQL ordered result)
        return results.stream()
                .skip(skip)
                .limit(limit)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public FeedbackDTO getFeedbackById(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Feedback not found with id: " + id));
        return convertToDTO(feedback);
    }

    @Override
    public FeedbackDTO updateStatus(Long id, FeedbackAdminUpdateInput updateInput) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Feedback not found with id: " + id));

        if (updateInput.getStatus() != null && !updateInput.getStatus().isBlank()) {
            feedback.setStatus(updateInput.getStatus());
        }

        Feedback updated = feedbackRepository.save(feedback);
        return convertToDTO(updated);
    }

    @Override
    public void deleteFeedback(Long id) {
        if (!feedbackRepository.existsById(id)) {
            throw new EntityNotFoundException("Feedback not found with id: " + id);
        }
        feedbackRepository.deleteById(id);
    }

    @Override
    public FeedbackStatsData getFeedbackStats() {
        List<Feedback> all = feedbackRepository.findAll();

        long totalCount = all.size();

        // Fixed: use mapToDouble on Integer field (mapToLong caused autoboxing issues)
        double avgRating = all.stream()
                .filter(f -> f.getRating() != null)
                .mapToDouble(Feedback::getRating)
                .average()
                .orElse(0.0);

        Map<String, Long> statusBreakdown = new HashMap<>();
        Map<String, Long> typeDistribution = new HashMap<>();

        for (Feedback f : all) {
            if (f.getStatus() != null) {
                statusBreakdown.merge(f.getStatus(), 1L, (a, b) -> a + b);
            }
            if (f.getType() != null) {
                typeDistribution.merge(f.getType(), 1L, (a, b) -> a + b);
            }
        }

        return new FeedbackStatsData(totalCount, avgRating, statusBreakdown, typeDistribution);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private FeedbackDTO convertToDTO(Feedback feedback) {
        FeedbackDTO dto = new FeedbackDTO();
        dto.setId(feedback.getId());
        dto.setUser_id(feedback.getUserId());
        dto.setType(feedback.getType());
        dto.setSubject(feedback.getSubject());
        dto.setMessage(feedback.getMessage());
        dto.setRating(feedback.getRating());
        dto.setStatus(feedback.getStatus());
        dto.setScreenshot_url(feedback.getScreenshotUrl());
        dto.setCreated_at(feedback.getCreatedAt());
        dto.setUpdated_at(feedback.getUpdatedAt());
        return dto;
    }
}