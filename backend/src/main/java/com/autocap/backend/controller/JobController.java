package com.autocap.backend.controller;

import com.autocap.backend.dto.FastApiCallbackDto;
import com.autocap.backend.dto.JobStatusDto;
import com.autocap.backend.service.JobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobController {

    private final JobService jobService;

    @GetMapping("/{jobId}/status")
    public ResponseEntity<JobStatusDto> getJobStatus(@PathVariable("jobId") Long jobId) {
        JobStatusDto status = jobService.getStatus(jobId);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/{jobId}/callback")
    public ResponseEntity<Void> processCallback(
            @PathVariable("jobId") Long jobId,
            @RequestBody FastApiCallbackDto callbackDto) {
        log.info("Received callback for job {}", jobId);
        jobService.processCallback(jobId, callbackDto);
        return ResponseEntity.ok().build();
    }
}
