package com.autocap.backend.exception;

import com.autocap.backend.dto.ErrorResponse;
import com.autocap.backend.dto.ErrorResponseDto;
import com.autocap.backend.service.ImageUploadService;
import com.autocap.backend.service.JobService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── Feature-branch-specific handlers ──

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

    // ── Documentation-module handlers ──

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFoundException(NotFoundException ex) {
        log.warn("Not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(SlugAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleSlugAlreadyExistsException(SlugAlreadyExistsException ex) {
        log.warn("Slug conflict: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }

    // ── General handlers ──

    /**
     * Handle our own ResponseStatusException (thrown explicitly in service methods).
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
        ErrorResponse error = new ErrorResponse(ex.getReason());
        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }

    /**
     * Fallback handler for any unexpected exception.
     * Logs the full stack trace so we can diagnose unknown 500s.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled exception: ", ex);
        String message = ex.getMessage();
        if (ex.getCause() != null && ex.getCause().getMessage() != null) {
            message = message + " | Caused by: " + ex.getCause().getMessage();
        }
        ErrorResponse error = new ErrorResponse(message != null ? message : "An unexpected error occurred. Please try again.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    /**
     * Handle MaxUploadSizeExceededException
     * to return our custom ErrorResponseDto shape.
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponseDto> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex) {
        log.warn("Upload size exceeded: {}", ex.getMessage());
        ErrorResponseDto body = new ErrorResponseDto("UPLOAD_TOO_LARGE",
                "Upload failed: each file must be under 10 MB and the total request must be under 500 MB. Please reduce the number or size of images.",
                400);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Override the parent's handleExceptionInternal so that Spring MVC's
     * built-in exceptions (MissingServletRequestParameterException,
     * NoResourceFoundException, etc.) still produce our ErrorResponse shape
     * instead of Spring's default ProblemDetail / body.
     */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex,
            Object body,
            HttpHeaders headers,
            HttpStatusCode statusCode,
            WebRequest request) {
        log.warn("Spring MVC exception [{}]: {}", statusCode, ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                ex.getMessage() != null ? ex.getMessage() : "Request error");
        return ResponseEntity.status(statusCode).headers(headers).body(error);
    }
}
