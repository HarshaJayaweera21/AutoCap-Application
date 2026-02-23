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
    public Long createJob(Long datasetId, int totalCount) {
        Long jobId = jobIdGenerator.getAndIncrement();
        JobStatusDto status = new JobStatusDto(
                jobId,
                JobStatus.UPLOADING,
                0,
                totalCount,
                null,
                datasetId);
        jobStore.put(jobId, status);
        log.info("Created in-memory job {} for dataset {} with {} images", jobId, datasetId, totalCount);
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
        Long datasetId = jobStatus.getDatasetId();

        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new JobNotFoundException("Dataset " + datasetId + " not found"));

        if ("FAILED".equalsIgnoreCase(callbackDto.getStatus())) {
            jobStatus.setStatus(JobStatus.FAILED);
            jobStatus.setErrorMessage(callbackDto.getErrorMessage());
            log.error("Job {} failed: {}", jobId, callbackDto.getErrorMessage());
            return;
        }

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
            itemId.setDatasetId(datasetId);
            itemId.setImageId(image.getId());
            itemId.setCaptionId(caption.getId());

            DatasetItem item = new DatasetItem();
            item.setId(itemId);
            item.setDataset(dataset);
            item.setImage(image);
            item.setCaption(caption);
            datasetItemRepository.save(item);

            // Update image status
            image.setStatus(ImageStatus.completed);
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
