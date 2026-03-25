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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<RecentDatasetDto> datasets = datasetService.getRecentDatasets(user, limit);
        return ResponseEntity.ok(datasets);
    }

    @GetMapping("/{datasetId}/download")
    public ResponseEntity<Resource> downloadDataset(@PathVariable("datasetId") Long datasetId) {
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

    @GetMapping("/{datasetId}/items")
    public ResponseEntity<org.springframework.data.domain.Page<com.autocap.backend.dto.PublicCaptionSearchDto>> getDatasetItems(
            @PathVariable("datasetId") Long datasetId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(datasetService.getDatasetItems(datasetId, pageable));
    }

    @PutMapping("/{datasetId}/captions")
    public ResponseEntity<Void> updateCaptions(
            @PathVariable("datasetId") Long datasetId,
            @RequestBody com.autocap.backend.dto.BatchCaptionUpdateRequest request) {
        
        datasetService.updateCaptions(datasetId, request.getUpdates());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{datasetId}/items")
    public ResponseEntity<Void> deleteDatasetItems(
            @PathVariable("datasetId") Long datasetId,
            @RequestBody com.autocap.backend.dto.DeleteItemsRequest request) {
        
        datasetService.deleteDatasetItems(datasetId, request.getCaptionIds());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my")
    public ResponseEntity<List<com.autocap.backend.dto.MyDatasetDto>> getMyDatasets(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(datasetService.getAllUserDatasets(user));
    }

    @PutMapping("/{datasetId}")
    public ResponseEntity<Void> updateDataset(
            @PathVariable("datasetId") Long datasetId,
            @RequestBody com.autocap.backend.dto.DatasetUpdateRequest request) {
        datasetService.updateDataset(datasetId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{datasetId}")
    public ResponseEntity<Void> deleteDataset(
            @PathVariable("datasetId") Long datasetId) {
        datasetService.deleteEntireDataset(datasetId);
        return ResponseEntity.ok().build();
    }
}
