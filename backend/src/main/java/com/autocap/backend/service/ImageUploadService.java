package com.autocap.backend.service;

import com.autocap.backend.dto.BlipConfigDto;
import com.autocap.backend.dto.UploadResponseDto;
import com.autocap.backend.entity.Image;
import com.autocap.backend.entity.User;
import com.autocap.backend.entity.enums.FlagStatus;
import com.autocap.backend.entity.enums.ImageStatus;
import com.autocap.backend.entity.enums.JobStatus;
import com.autocap.backend.dto.FastApiJobRequestDto;
import com.autocap.backend.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageUploadService {

    private static final int MAX_FILES = 50;
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10 MB
    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    private final ImageRepository imageRepository;
    private final JobService jobService;
    private final RestTemplate restTemplate;
    private final SupabaseStorageService storageService;

    /**
     * Validates files, uploads them to Supabase Storage, creates Image rows,
     * registers an in-memory job, and dispatches to the AI service.
     * Returns UploadResponseDto with jobId and datasetId.
     */
    @Transactional
    public UploadResponseDto processUpload(
            MultipartFile[] files,
            String datasetName,
            String datasetDescription,
            BlipConfigDto blipConfig,
            User user) {
        // 1. Validate files
        validateFiles(files);

        // 2. Upload each file to Supabase Storage and create Image rows
        List<FastApiJobRequestDto.ImageDto> imageDtos = new ArrayList<>();
        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                originalFilename = "unnamed_file_" + System.currentTimeMillis();
            }
            // Sanitize filename: keep only alphanumeric, dot, dash, underscore.
            // This prevents double-encoding when RestTemplate builds the upload URL.
            String safeFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            // Storage path: <userId>/<timestamp>_<safeFilename>
            String storagePath = user.getId() + "/" + System.currentTimeMillis() + "_" + safeFilename;

            // Upload to Supabase Storage; returns the public URL
            String publicUrl = storageService.upload(storagePath, file);
            log.info("Uploaded file to Supabase Storage: {}", publicUrl);

            // Persist Image record – file_path stores the Supabase public URL
            Image image = new Image();
            image.setUser(user);
            image.setFilePath(publicUrl);
            image.setOriginalName(originalFilename);
            image.setFileSize(file.getSize());
            image.setMimeType(file.getContentType());
            image.setStatus(ImageStatus.uploaded);
            image.setIsFlagged(false);
            image.setFlagStatus(FlagStatus.Clean);
            imageRepository.save(image);

            // Pass the public URL to the AI service so it can download the image
            imageDtos.add(new FastApiJobRequestDto.ImageDto(image.getId(), publicUrl));
        }
        log.info("Saved {} image records for user {}", files.length, user.getId());

        // 3. Create in-memory job entry
        Long jobId = jobService.createJob(user, datasetName, datasetDescription, blipConfig.getModelVariant(),
                files.length);
        jobService.updateStatus(jobId, JobStatus.QUEUED);

        // 4. Dispatch to FastAPI POST /api/jobs/process
        FastApiJobRequestDto jobRequest = new FastApiJobRequestDto(
                jobId,
                user.getId(),
                datasetName,
                datasetDescription,
                blipConfig.getModelVariant(),
                imageDtos);

        try {
            log.info("Dispatching job {} to FastAPI service", jobId);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "http://127.0.0.1:8000/api/jobs/process",
                    jobRequest,
                    String.class);
            log.info("FastAPI service responded with status: {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to dispatch job to FastAPI service", e);
            jobService.updateStatus(jobId, JobStatus.FAILED);
        }

        return new UploadResponseDto(jobId, null);
    }

    private void validateFiles(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new ValidationException("Please select at least one image.");
        }
        if (files.length > MAX_FILES) {
            throw new ValidationException("Max " + MAX_FILES + " images per batch.");
        }
        for (MultipartFile file : files) {
            if (!ALLOWED_TYPES.contains(file.getContentType())) {
                throw new ValidationException(
                        "\"" + file.getOriginalFilename() + "\" is not a supported format (JPEG, PNG, WebP only).");
            }
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new ValidationException(
                        "\"" + file.getOriginalFilename() + "\" exceeds the 10 MB size limit.");
            }
        }
    }

    public static class ValidationException extends RuntimeException {
        public ValidationException(String message) {
            super(message);
        }
    }
}
