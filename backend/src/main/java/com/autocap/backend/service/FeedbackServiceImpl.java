package com.autocap.backend.service;

import com.autocap.backend.dto.FeedbackAdminUpdateInput;
import com.autocap.backend.dto.FeedbackCreateInput;
import com.autocap.backend.dto.FeedbackDTO;
import com.autocap.backend.dto.FeedbackStatsData;
import com.autocap.backend.dto.FeedbackUpdateInput;
import com.autocap.backend.entity.Feedback;
import com.autocap.backend.entity.User;
import com.autocap.backend.entity.enums.FeedbackStatus;
import com.autocap.backend.entity.enums.FeedbackType;
import com.autocap.backend.repository.FeedbackRepository;
import com.autocap.backend.repository.UserRepository;
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

    @Autowired
    private UserRepository userRepository;

    @Override
    public FeedbackDTO createFeedback(FeedbackCreateInput input, Long userId) {
        Feedback feedback = new Feedback();

        // Look up the User entity by ID if provided
        if (userId != null && userId > 0) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
            feedback.setUser(user);
        }

        // Convert String type from DTO to enum
        String typeStr = input.getType() != null ? input.getType() : "General";
        feedback.setType(FeedbackType.fromDbValue(typeStr));

        feedback.setSubject(input.getSubject());
        feedback.setMessage(input.getMessage());
        feedback.setRating(input.getRating());
        feedback.setScreenshotUrl(input.getScreenshot_url());
        feedback.setStatus(FeedbackStatus.NEW); // Always start as New

        Feedback saved = feedbackRepository.save(feedback);
        return convertToDTO(saved);
    }

    @Override
    public List<FeedbackDTO> getAllFeedback(String type, String status, String search, int skip, int limit) {
        // Pass type/status strings directly — the JPQL query compares against
        // the DB column which stores the multi-word string values via converter
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
            feedback.setStatus(FeedbackStatus.fromDbValue(updateInput.getStatus()));
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

        double avgRating = all.stream()
                .filter(f -> f.getRating() != null)
                .mapToDouble(Feedback::getRating)
                .average()
                .orElse(0.0);

        Map<String, Long> statusBreakdown = new HashMap<>();
        Map<String, Long> typeDistribution = new HashMap<>();

        for (Feedback f : all) {
            if (f.getStatus() != null) {
                statusBreakdown.merge(f.getStatus().getDbValue(), 1L, (a, b) -> a + b);
            }
            if (f.getType() != null) {
                typeDistribution.merge(f.getType().getDbValue(), 1L, (a, b) -> a + b);
            }
        }

        return new FeedbackStatsData(totalCount, avgRating, statusBreakdown, typeDistribution);
    }

    @Override
    public FeedbackDTO updateFeedback(Long id, FeedbackUpdateInput updateInput, Long userId) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Feedback not found with id: " + id));

        // Check ownership
        Long feedbackUserId = feedback.getUser() != null ? feedback.getUser().getId() : null;
        if (feedbackUserId == null || !feedbackUserId.equals(userId)) {
            throw new EntityNotFoundException("Feedback not found or access denied");
        }

        if (updateInput.getType() != null && !updateInput.getType().isBlank()) {
            feedback.setType(FeedbackType.fromDbValue(updateInput.getType()));
        }
        if (updateInput.getSubject() != null) {
            feedback.setSubject(updateInput.getSubject());
        }
        if (updateInput.getMessage() != null && !updateInput.getMessage().isBlank()) {
            feedback.setMessage(updateInput.getMessage());
        }
        if (updateInput.getRating() != null) {
            feedback.setRating(updateInput.getRating());
        }
        if (updateInput.getScreenshot_url() != null) {
            feedback.setScreenshotUrl(updateInput.getScreenshot_url());
        }

        Feedback updated = feedbackRepository.save(feedback);
        return convertToDTO(updated);
    }

    @Override
    public void deleteFeedbackByUser(Long id, Long userId) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Feedback not found with id: " + id));

        // Check ownership
        Long feedbackUserId = feedback.getUser() != null ? feedback.getUser().getId() : null;
        if (feedbackUserId == null || !feedbackUserId.equals(userId)) {
            throw new EntityNotFoundException("Feedback not found or access denied");
        }

        feedbackRepository.deleteById(id);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private FeedbackDTO convertToDTO(Feedback feedback) {
        FeedbackDTO dto = new FeedbackDTO();
        dto.setId(feedback.getId());
        dto.setUser_id(feedback.getUser() != null ? feedback.getUser().getId() : null);
        dto.setType(feedback.getType() != null ? feedback.getType().getDbValue() : null);
        dto.setSubject(feedback.getSubject());
        dto.setMessage(feedback.getMessage());
        dto.setRating(feedback.getRating());
        dto.setStatus(feedback.getStatus() != null ? feedback.getStatus().getDbValue() : null);
        dto.setScreenshot_url(feedback.getScreenshotUrl());
        dto.setCreated_at(feedback.getCreatedAt());
        dto.setUpdated_at(feedback.getUpdatedAt());
        return dto;
    }
}