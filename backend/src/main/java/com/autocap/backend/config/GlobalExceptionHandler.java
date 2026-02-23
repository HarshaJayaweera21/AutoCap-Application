package com.autocap.backend.config;

import com.autocap.backend.dto.ErrorResponseDto;
import com.autocap.backend.service.ImageUploadService;
import com.autocap.backend.service.JobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ImageUploadService.ValidationException.class)
    public ResponseEntity<ErrorResponseDto> handleValidation(ImageUploadService.ValidationException ex) {
        log.warn("Validation error: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                new ErrorResponseDto("VALIDATION_ERROR", ex.getMessage(), 400));
    }

    @ExceptionHandler(JobService.JobNotFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleJobNotFound(JobService.JobNotFoundException ex) {
        log.warn("Job not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                new ErrorResponseDto("NOT_FOUND", ex.getMessage(), 404));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponseDto> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        log.warn("Upload size exceeded: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                new ErrorResponseDto("UPLOAD_TOO_LARGE", "File size exceeds the maximum allowed limit.", 400));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponseDto> handleRuntime(RuntimeException ex) {
        log.error("Unexpected error: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErrorResponseDto("INTERNAL_ERROR", ex.getMessage(), 500));
    }
}
