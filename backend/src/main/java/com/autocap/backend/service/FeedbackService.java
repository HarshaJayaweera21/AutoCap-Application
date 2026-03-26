package com.autocap.backend.service;

import com.autocap.backend.dto.FeedbackAdminUpdateInput;
import com.autocap.backend.dto.FeedbackCreateInput;
import com.autocap.backend.dto.FeedbackDTO;
import com.autocap.backend.dto.FeedbackStatsData;
import com.autocap.backend.dto.FeedbackUpdateInput;

import java.util.List;

public interface FeedbackService {
    FeedbackDTO createFeedback(FeedbackCreateInput requestDTO, Long userId);

    List<FeedbackDTO> getAllFeedback(String type, String status, String search, int skip, int limit);

    FeedbackDTO getFeedbackById(Long id);

    FeedbackDTO updateStatus(Long id, FeedbackAdminUpdateInput updateInput);

    void deleteFeedback(Long id);

    FeedbackStatsData getFeedbackStats();

    FeedbackDTO updateFeedback(Long id, FeedbackUpdateInput updateInput, Long userId);

    void deleteFeedbackByUser(Long id, Long userId);
}