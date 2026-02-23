package com.autocap.backend.service;

import com.autocap.backend.dto.BlipConfigDto;
import com.autocap.backend.dto.UploadResponseDto;
import com.autocap.backend.entity.Dataset;
import com.autocap.backend.entity.Image;
import com.autocap.backend.entity.User;
import com.autocap.backend.entity.enums.FlagStatus;
import com.autocap.backend.entity.enums.ImageStatus;
import com.autocap.backend.entity.enums.JobStatus;
import com.autocap.backend.repository.DatasetRepository;
import com.autocap.backend.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageUploadService {

    private static final int MAX_FILES = 50;
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10 MB
    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    private final ImageRepository imageRepository;
    private final DatasetRepository datasetRepository;
    private final JobService jobService;

    /**
     * Validates files, creates Dataset + Image rows, registers an in-memory job.
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

        // 2. Create Dataset row
        Dataset dataset = new Dataset();
        dataset.setUser(user);
        dataset.setName(datasetName);
        dataset.setDescription(datasetDescription);
        dataset.setModelName(blipConfig.getModelVariant());
        dataset.setTotalItems(0);
        dataset.setIsPublic(false);
        dataset = datasetRepository.save(dataset);
        log.info("Created dataset {} for user {}", dataset.getId(), user.getId());

        // Prepare physical upload directory
        Path uploadDir = Paths.get("uploads", user.getId().toString());
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            log.error("Failed to create upload directory {}", uploadDir, e);
            throw new RuntimeException("Could not initialize storage for user " + user.getId(), e);
        }

        // 3. Create Image rows for each file and save physically
        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                originalFilename = "unnamed_file_" + System.currentTimeMillis();
            }
            String filename = System.currentTimeMillis() + "_" + originalFilename;
            Path destinationFile = uploadDir.resolve(filename).normalize().toAbsolutePath();

            try {
                // Security check to ensure file is inside the directory
                if (!destinationFile.getParent().equals(uploadDir.toAbsolutePath())) {
                    throw new RuntimeException("Cannot store file outside current directory.");
                }
                Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                log.error("Failed to store file {}", filename, e);
                throw new RuntimeException("Failed to store file " + filename, e);
            }

            Image image = new Image();
            image.setUser(user);
            image.setFilePath("uploads/" + user.getId() + "/" + filename);
            image.setOriginalName(originalFilename);
            image.setFileSize(file.getSize());
            image.setMimeType(file.getContentType());
            image.setStatus(ImageStatus.uploaded);
            image.setIsFlagged(false);
            image.setFlagStatus(FlagStatus.Clean);
            imageRepository.save(image);
        }
        log.info("Saved {} image records for dataset {}", files.length, dataset.getId());

        // 4. Create in-memory job entry
        Long jobId = jobService.createJob(dataset.getId(), files.length);
        jobService.updateStatus(jobId, JobStatus.QUEUED);

        // 5. Stub: Log where FastAPI dispatch would go
        log.info("[STUB] Would dispatch to FastAPI POST /caption/batch for job {} with {} images", jobId, files.length);

        return new UploadResponseDto(jobId, dataset.getId());
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
