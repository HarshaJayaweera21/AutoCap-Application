package com.autocap.backend.service;

import com.autocap.backend.dto.AdminStatsResponse;
import com.autocap.backend.dto.DatasetIntelligenceResponse;
import com.autocap.backend.dto.UserDto;
import com.autocap.backend.dto.UserUpdateRequest;
import com.autocap.backend.entity.User;
import com.autocap.backend.repository.CaptionRepository;
import com.autocap.backend.repository.DatasetRepository;
import com.autocap.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final CaptionRepository captionRepository;
    private final DatasetRepository datasetRepository;

    public AdminService(UserRepository userRepository,
            CaptionRepository captionRepository,
            DatasetRepository datasetRepository) {
        this.userRepository = userRepository;
        this.captionRepository = captionRepository;
        this.datasetRepository = datasetRepository;
    }

    public AdminStatsResponse getStats(String adminEmail) {

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin user not found"));

        long totalUsers = userRepository.countByRole_NameNot("ADMIN");
        long activeUsers = userRepository.countByIsActiveTrueAndRole_NameNot("ADMIN");
        long deactiveUsers = userRepository.countByIsActiveFalseAndRole_NameNot("ADMIN");

        return new AdminStatsResponse(
                admin.getFirstName(),
                admin.getLastName(),
                totalUsers,
                activeUsers,
                deactiveUsers);
    }

    // ── Dataset Intelligence ──

    public DatasetIntelligenceResponse getDatasetIntelligence() {

        // Time boundaries
        Instant now = Instant.now();
        Instant oneWeekAgo = now.minus(7, ChronoUnit.DAYS);
        Instant twoWeeksAgo = now.minus(14, ChronoUnit.DAYS);

        // ── Row 1: Key Metrics ──
        long totalCaptions = captionRepository.count();
        long validatedCaptions = captionRepository.countByImage_IsFlaggedFalse();
        long rejectedCaptions = captionRepository.countByImage_IsFlaggedTrue();
        long totalDatasets = datasetRepository.count();

        // Weekly comparisons — this week vs last week
        long totalThisWeek = captionRepository.countByCreatedAtBetween(oneWeekAgo, now);
        long totalLastWeek = captionRepository.countByCreatedAtBetween(twoWeeksAgo, oneWeekAgo);

        long validatedThisWeek = captionRepository.countByImage_IsFlaggedFalseAndCreatedAtBetween(oneWeekAgo, now);
        long validatedLastWeek = captionRepository.countByImage_IsFlaggedFalseAndCreatedAtBetween(twoWeeksAgo,
                oneWeekAgo);

        long rejectedThisWeek = captionRepository.countByImage_IsFlaggedTrueAndCreatedAtBetween(oneWeekAgo, now);
        long rejectedLastWeek = captionRepository.countByImage_IsFlaggedTrueAndCreatedAtBetween(twoWeeksAgo,
                oneWeekAgo);

        long datasetsThisWeek = datasetRepository.countByCreatedAtBetween(oneWeekAgo, now);
        long datasetsLastWeek = datasetRepository.countByCreatedAtBetween(twoWeeksAgo, oneWeekAgo);

        Double totalCaptionsChange = computeChange(totalThisWeek, totalLastWeek);
        Double validatedCaptionsChange = computeChange(validatedThisWeek, validatedLastWeek);
        Double rejectedCaptionsChange = computeChange(rejectedThisWeek, rejectedLastWeek);
        Double totalDatasetsChange = computeChange(datasetsThisWeek, datasetsLastWeek);

        // ── Row 2: Captions per day (last 30 days) ──
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);
        List<Object[]> rawDaily = captionRepository.countCaptionsPerDaySince(thirtyDaysAgo);
        List<DatasetIntelligenceResponse.DailyCaptionCount> captionsPerDay = new ArrayList<>();
        for (Object[] row : rawDaily) {
            String date = row[0] instanceof Date d ? d.toString() : row[0].toString();
            long cnt = ((Number) row[1]).longValue();
            captionsPerDay.add(new DatasetIntelligenceResponse.DailyCaptionCount(date, cnt));
        }

        // ── Row 2: Validation rate ──
        double validationRate = totalCaptions > 0
                ? Math.round((double) validatedCaptions / totalCaptions * 10000.0) / 100.0
                : 0.0;

        // ── Row 3: Similarity statistics ──
        Double avgSimilarity = captionRepository.findAverageSimilarityScore();
        Double maxSimilarity = captionRepository.findMaxSimilarityScore();
        Double minSimilarity = captionRepository.findMinSimilarityScore();

        // Round avg to 2 decimal places
        if (avgSimilarity != null) {
            avgSimilarity = Math.round(avgSimilarity * 100.0) / 100.0;
        }

        // ── Row 3: Similarity distribution ──
        List<Object[]> rawBuckets = captionRepository.findSimilarityDistribution();
        List<DatasetIntelligenceResponse.SimilarityBucket> similarityDistribution = new ArrayList<>();
        for (Object[] row : rawBuckets) {
            String range = (String) row[0];
            long cnt = ((Number) row[1]).longValue();
            similarityDistribution.add(new DatasetIntelligenceResponse.SimilarityBucket(range, cnt));
        }

        return DatasetIntelligenceResponse.builder()
                .totalCaptions(totalCaptions)
                .validatedCaptions(validatedCaptions)
                .rejectedCaptions(rejectedCaptions)
                .totalDatasets(totalDatasets)
                .totalCaptionsChange(totalCaptionsChange)
                .validatedCaptionsChange(validatedCaptionsChange)
                .rejectedCaptionsChange(rejectedCaptionsChange)
                .totalDatasetsChange(totalDatasetsChange)
                .captionsPerDay(captionsPerDay)
                .validationRate(validationRate)
                .avgSimilarity(avgSimilarity)
                .maxSimilarity(maxSimilarity)
                .minSimilarity(minSimilarity)
                .similarityDistribution(similarityDistribution)
                .build();
    }

    /**
     * Compute percentage change between two periods.
     * Returns null when there is no prior-period data.
     */
    private Double computeChange(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? null : 0.0; // null → "New" on the frontend
        }
        return Math.round((double) (current - previous) / previous * 10000.0) / 100.0;
    }

    // ── Existing user-management methods ──

    public Page<UserDto> getUsers(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("id").ascending());
        Page<User> users = userRepository.findByRole_Name("USER", pageRequest);
        return users.map(UserDto::fromEntity);
    }

    @Transactional
    public UserDto updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            user.setLastName(request.getLastName());
        }

        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto toggleActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setIsActive(!user.getIsActive());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return UserDto.fromEntity(user);
    }
}
