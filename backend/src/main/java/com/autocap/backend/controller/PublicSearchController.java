package com.autocap.backend.controller;

import com.autocap.backend.dto.ExportRequestDto;
import com.autocap.backend.dto.ExportStatusDto;
import com.autocap.backend.dto.PagedResponse;
import com.autocap.backend.dto.PublicCaptionSearchDto;
import com.autocap.backend.service.ExportJobService;
import com.autocap.backend.service.PublicSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class PublicSearchController {

    private final PublicSearchService publicSearchService;
    private final ExportJobService exportJobService;

    @GetMapping("/public-captions")
    public ResponseEntity<?> searchPublicCaptions(
            @RequestParam(value = "query") String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            PagedResponse<PublicCaptionSearchDto> result = publicSearchService.searchPublicCaptions(query, pageable);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("SEARCH API ERROR: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error", "cause", String.valueOf(e.getCause())));
        }
    }

    @PostMapping("/export/start")
    public ResponseEntity<?> startExport(@RequestBody ExportRequestDto request) {
        if (request.getCaptionIds() == null || request.getCaptionIds().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No caption IDs provided"));
        }
        String jobId = exportJobService.startExportJob(request.getCaptionIds());
        return ResponseEntity.ok(Map.of("jobId", jobId));
    }

    @GetMapping("/export/status/{jobId}")
    public ResponseEntity<ExportStatusDto> getExportStatus(@PathVariable("jobId") String jobId) {
        ExportStatusDto status = exportJobService.getJobStatus(jobId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

    @GetMapping("/export/download/{jobId}")
    public ResponseEntity<Resource> downloadExport(@PathVariable("jobId") String jobId) throws Exception {
        Path filePath = exportJobService.getJobFile(jobId);
        if (filePath == null || !filePath.toFile().exists()) {
            return ResponseEntity.notFound().build();
        }
        
        Resource resource = new UrlResource(filePath.toUri());
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"dataset_export.zip\"")
                .body(resource);
    }
}
