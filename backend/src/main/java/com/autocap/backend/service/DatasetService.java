package com.autocap.backend.service;

import com.autocap.backend.dto.RecentDatasetDto;
import com.autocap.backend.entity.Dataset;
import com.autocap.backend.entity.User;
import com.autocap.backend.repository.DatasetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatasetService {

    private final DatasetRepository datasetRepository;

    /**
     * Returns the most recent datasets for a given user.
     */
    public List<RecentDatasetDto> getRecentDatasets(User user, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        List<Dataset> datasets = datasetRepository.findRecentByUser(user, PageRequest.of(0, safeLimit));
        return datasets.stream()
                .map(d -> new RecentDatasetDto(
                        d.getId(),
                        d.getName(),
                        d.getModelName(),
                        d.getTotalItems(),
                        d.getAverageSimilarity(),
                        d.getCreatedAt()))
                .collect(Collectors.toList());
    }
}
