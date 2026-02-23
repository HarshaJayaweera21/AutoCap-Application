package com.autocap.backend.controller;

import com.autocap.backend.dto.RecentDatasetDto;
import com.autocap.backend.entity.User;
import com.autocap.backend.repository.UserRepository;
import com.autocap.backend.service.DatasetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/datasets")
@RequiredArgsConstructor
@Slf4j
public class DatasetController {

    private final DatasetService datasetService;
    private final UserRepository userRepository;

    @GetMapping("/recent")
    public ResponseEntity<List<RecentDatasetDto>> getRecentDatasets(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        // For now, use the first available user (JWT auth is deferred)
        User user = userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No users found in the database."));

        List<RecentDatasetDto> datasets = datasetService.getRecentDatasets(user, limit);
        return ResponseEntity.ok(datasets);
    }

    @GetMapping("/{datasetId}/download")
    public ResponseEntity<Map<String, String>> downloadDataset(@PathVariable Long datasetId) {
        // Stub response
        return ResponseEntity.ok(Map.of("message", "Download coming soon"));
    }
}
