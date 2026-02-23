package com.autocap.backend.controller;

import com.autocap.backend.dto.RecentDatasetDto;
import com.autocap.backend.entity.User;
import com.autocap.backend.repository.UserRepository;
import com.autocap.backend.service.DatasetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

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
        User user = userRepository.findById(5L)
                .orElseThrow(() -> new RuntimeException("No users found in the database."));

        List<RecentDatasetDto> datasets = datasetService.getRecentDatasets(user, limit);
        return ResponseEntity.ok(datasets);
    }

    @GetMapping("/{datasetId}/download")
    public ResponseEntity<Resource> downloadDataset(@PathVariable Long datasetId) {
        try {
            byte[] zipBytes = datasetService.downloadDataset(datasetId);
            ByteArrayResource resource = new ByteArrayResource(zipBytes);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/zip"));
            headers.setContentDispositionFormData("attachment", "dataset-" + datasetId + ".zip");
            headers.setContentLength(zipBytes.length);

            return new ResponseEntity<>(resource, headers, HttpStatus.OK);

        } catch (DatasetService.DatasetNotFoundException e) {
            log.warn("Download requested for non-existent dataset {}", datasetId);
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            log.error("Failed to build ZIP for dataset {}", datasetId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
