package com.autocap.backend.service;

import com.autocap.backend.dto.FastApiCallbackDto;
import com.autocap.backend.dto.JobStatusDto;
import com.autocap.backend.entity.Caption;
import com.autocap.backend.entity.Dataset;
import com.autocap.backend.entity.DatasetItem;
import com.autocap.backend.entity.DatasetItemId;
import com.autocap.backend.entity.Image;
import com.autocap.backend.entity.enums.ImageStatus;
import com.autocap.backend.entity.enums.JobStatus;
import com.autocap.backend.repository.CaptionRepository;
import com.autocap.backend.repository.DatasetItemRepository;
import com.autocap.backend.repository.DatasetRepository;
import com.autocap.backend.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final ConcurrentHashMap<Long, JobStatusDto> jobStore = new ConcurrentHashMap<>();
    private final AtomicLong jobIdGenerator = new AtomicLong(1);

    private final CaptionRepository captionRepository;
    private final DatasetItemRepository datasetItemRepository;
    private final DatasetRepository datasetRepository;
    private final ImageRepository imageRepository;

    /**
     * Creates an in-memory job entry. Returns the synthetic jobId.
     */
    public Long createJob(com.autocap.backend.entity.User user, String datasetName, String datasetDescription,
            String modelName, int totalCount) {
        Long jobId = jobIdGenerator.getAndIncrement();
        JobStatusDto status = new JobStatusDto(
                jobId,
                JobStatus.UPLOADING,
                0,
                totalCount,
                null,
                null,
                null,
                user,
                datasetName,
                datasetDescription,
                modelName);

        jobStore.put(jobId, status);
        log.info("Created in-memory job {} with {} images", jobId, totalCount);
        return jobId;
    }

    /**
     * Updates job status in the in-memory store.
     */
    public void updateStatus(Long jobId, JobStatus newStatus) {
        JobStatusDto dto = jobStore.get(jobId);
        if (dto != null) {
            dto.setStatus(newStatus);
            log.info("Job {} status updated to {}", jobId, newStatus);
        }
    }

    /**
     * Returns current job status from in-memory store.
     */
    public JobStatusDto getStatus(Long jobId) {
        JobStatusDto dto = jobStore.get(jobId);
        if (dto == null) {
            throw new JobNotFoundException("Job with id " + jobId + " not found");
        }
        return dto;
    }

    /**
     * Processes the FastAPI callback: inserts captions, dataset_items,
     * updates dataset aggregates, and marks the job as COMPLETE or FAILED.
     */
    @Transactional
    public void processCallback(Long jobId, FastApiCallbackDto callbackDto) {
        JobStatusDto jobStatus = getStatus(jobId);

        if ("FAILED".equalsIgnoreCase(callbackDto.getStatus())) {
            jobStatus.setStatus(JobStatus.FAILED);
            jobStatus.setErrorMessage(callbackDto.getErrorMessage());
            log.error("Job {} failed: {}", jobId, callbackDto.getErrorMessage());
            return;
        }

        // Generate a logical dataset identifier (no local filesystem needed – images
        // live in Supabase)
        String datasetFolderName = "dataset_" + System.currentTimeMillis();
        String datasetFilePath = "supabase://Images/" + jobStatus.getUser().getId() + "/" + datasetFolderName;

        // Create the dataset entity
        Dataset dataset = new Dataset();
        dataset.setUser(jobStatus.getUser());
        dataset.setName(jobStatus.getDatasetName());
        dataset.setDescription(jobStatus.getDatasetDescription());
        dataset.setModelName(jobStatus.getModelName());
        dataset.setTotalItems(0);
        dataset.setIsPublic(false);
        dataset.setFilePath(datasetFilePath);
        dataset = datasetRepository.save(dataset);
        log.info("Deferred Creation: Created dataset {} with path {} for user {} based on Job {}",
                dataset.getId(), datasetFilePath, jobStatus.getUser().getId(), jobId);

        // Link the job to the new datasetId
        jobStatus.setDatasetId(dataset.getId());

        double totalSimilarity = 0.0;
        int scoreCount = 0;

        for (FastApiCallbackDto.CaptionResultDto result : callbackDto.getResults()) {
            // Find the image
            Image image = imageRepository.findById(result.getImageId())
                    .orElse(null);
            if (image == null) {
                log.warn("Image {} not found for job {}, skipping", result.getImageId(), jobId);
                continue;
            }

            // Insert caption
            Caption caption = new Caption();
            caption.setImage(image);
            caption.setUser(dataset.getUser());
            caption.setCaptionText(result.getCaptionText());
            caption.setSimilarityScore(result.getSimilarityScore());
            caption.setBleu1(result.getBleu1());
            caption.setBleu2(result.getBleu2());
            caption.setBleu3(result.getBleu3());
            caption.setBleu4(result.getBleu4());
            caption.setMeteor(result.getMeteor());
            caption.setCider(result.getCider());
            caption.setModelName(result.getModelName());
            caption.setModelVersion(result.getModelVersion());
            caption.setIsAccepted(false);
            caption.setIsEdited(false);
            caption = captionRepository.save(caption);

            // Insert dataset_item
            DatasetItemId itemId = new DatasetItemId();
            itemId.setDatasetId(dataset.getId());
            itemId.setImageId(image.getId());
            itemId.setCaptionId(caption.getId());

            DatasetItem item = new DatasetItem();
            item.setId(itemId);
            item.setDataset(dataset);
            item.setImage(image);
            item.setCaption(caption);
            datasetItemRepository.save(item);

            // Update image status and flagging
            image.setStatus(ImageStatus.completed);
            image.setIsFlagged(result.getIsFlagged() != null ? result.getIsFlagged() : false);
            imageRepository.save(image);

            // Accumulate similarity scores
            if (result.getSimilarityScore() != null) {
                totalSimilarity += result.getSimilarityScore();
                scoreCount++;
            }
        }

        // Update dataset aggregates
        int processedCount = callbackDto.getResults().size();
        dataset.setTotalItems((dataset.getTotalItems() != null ? dataset.getTotalItems() : 0) + processedCount);
        if (scoreCount > 0) {
            dataset.setAverageSimilarity(totalSimilarity / scoreCount);
        }
        datasetRepository.save(dataset);

        // Update in-memory job status
        jobStatus.setProcessedCount(jobStatus.getProcessedCount() + processedCount);
        jobStatus.setStatus(JobStatus.COMPLETE);
        if (scoreCount > 0) {
            jobStatus.setAverageSimilarity(totalSimilarity / scoreCount);
        }
        log.info("Job {} completed. {} images processed.", jobId, processedCount);

    }

    /**
     * Custom exception for job not found.
     */
    public static class JobNotFoundException extends RuntimeException {
        public JobNotFoundException(String message) {
            super(message);
        }
    }
}
