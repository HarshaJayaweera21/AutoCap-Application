package com.autocap.backend.service;

import com.autocap.backend.dto.RecentDatasetDto;
import com.autocap.backend.entity.Dataset;
import com.autocap.backend.entity.DatasetItem;
import com.autocap.backend.entity.User;
import com.autocap.backend.repository.DatasetItemRepository;
import com.autocap.backend.repository.DatasetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.springframework.transaction.annotation.Transactional;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DatasetService {

    private final DatasetRepository datasetRepository;
    private final DatasetItemRepository datasetItemRepository;
    private final RestTemplate restTemplate;
    private final com.autocap.backend.repository.CaptionRepository captionRepository;
    private final com.autocap.backend.repository.ImageRepository imageRepository;
    
    private static final String SUPABASE_STORAGE_BASE_URL = "https://mztbiewiqjnairxnurfk.supabase.co/storage/v1/object/public/Images/";

    /**
     * Returns the most recent datasets for a given user.
     */
    public List<RecentDatasetDto> getRecentDatasets(User user, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        List<Dataset> datasets = datasetRepository.findRecentByUser(user, PageRequest.of(0, safeLimit));
        return datasets.stream()
                .map(d -> new RecentDatasetDto(
                        d.getId(),
                        d.getName(),
                        d.getModelName(),
                        d.getTotalItems(),
                        d.getAverageSimilarity(),
                        d.getCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * Builds an in-memory ZIP containing:
     *  - captions.txt  (filename TAB caption, one per line)
     *  - the actual image files
     *
     * Image bytes are fetched from Supabase Storage (when file_path is a URL)
     * or read from local disk (legacy datasets uploaded before the Supabase migration).
     *
     * @param datasetId the ID of the dataset to download
     * @return byte array of the ZIP archive
     * @throws IOException if ZIP stream writing fails
     */
    public byte[] downloadDataset(Long datasetId) throws IOException {
        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new DatasetNotFoundException("Dataset not found: " + datasetId));

        List<DatasetItem> items = datasetItemRepository.findAllByIdDatasetId(datasetId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {

            StringBuilder captionsSb = new StringBuilder();
            captionsSb.append("filename\tcaption\n");

            for (DatasetItem item : items) {
                String originalName = item.getImage() != null && item.getImage().getOriginalName() != null
                        ? item.getImage().getOriginalName()
                        : "image_" + item.getId().getImageId() + ".jpg";

                String captionText = item.getCaption() != null && item.getCaption().getCaptionText() != null
                        ? item.getCaption().getCaptionText()
                        : "";

                captionsSb.append(originalName).append("\t").append(captionText).append("\n");

                // Fetch and add the image bytes to the ZIP
                if (item.getImage() != null && item.getImage().getFilePath() != null) {
                    String filePath = item.getImage().getFilePath();
                    byte[] imageBytes = fetchImageBytes(filePath, item.getId().getImageId());
                    if (imageBytes != null) {
                        try {
                            ZipEntry imageEntry = new ZipEntry(originalName);
                            zos.putNextEntry(imageEntry);
                            zos.write(imageBytes);
                            zos.closeEntry();
                        } catch (IOException e) {
                            log.warn("Failed to zip image {}, skipping.", originalName, e);
                            try { zos.closeEntry(); } catch (Exception ignored) {}
                        }
                    }
                }
            }

            ZipEntry captionsEntry = new ZipEntry("captions.txt");
            zos.putNextEntry(captionsEntry);
            zos.write(captionsSb.toString().getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            log.info("Built download ZIP for dataset {} ({} items)", dataset.getId(), items.size());
        }

        return baos.toByteArray();
    }

    /**
     * Fetches image bytes from either a Supabase public URL or a local file path.
     * Returns null and logs a warning if the image cannot be retrieved.
     */
    private byte[] fetchImageBytes(String filePath, Long imageId) {
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            // Supabase Storage URL — download over HTTP
            try {
                ResponseEntity<byte[]> response = restTemplate.getForEntity(filePath, byte[].class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    log.debug("Downloaded image {} from Supabase ({} bytes)", imageId, response.getBody().length);
                    return response.getBody();
                } else {
                    log.warn("Unexpected status {} fetching image {} from {}", response.getStatusCode(), imageId, filePath);
                    return null;
                }
            } catch (Exception e) {
                log.warn("Failed to download image {} from Supabase URL {}: {}", imageId, filePath, e.getMessage());
                return null;
            }
        } else {
            // Legacy local path
            Path physicalPath = Paths.get(filePath);
            if (Files.exists(physicalPath) && Files.isReadable(physicalPath)) {
                try {
                    return Files.readAllBytes(physicalPath);
                } catch (IOException e) {
                    log.warn("Failed to read local image file {}: {}", physicalPath, e.getMessage());
                    return null;
                }
            } else {
                log.warn("Local image file not found: {}", physicalPath);
                return null;
            }
        }
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.autocap.backend.dto.PublicCaptionSearchDto> getDatasetItems(Long datasetId, org.springframework.data.domain.Pageable pageable) {
        return captionRepository.findItemsByDatasetId(datasetId, pageable)
                .map(projection -> com.autocap.backend.dto.PublicCaptionSearchDto.builder()
                        .captionId(projection.getCaptionId())
                        .imageId(projection.getImageId())
                        .imageUrl((projection.getOriginalName() != null) ? SUPABASE_STORAGE_BASE_URL + projection.getOriginalName() : null)
                        .captionText(projection.getCaptionText())
                        .similarityScore(projection.getSimilarityScore())
                        .isFlagged(projection.getIsFlagged())
                        .isEdited(projection.getIsEdited())
                        .build());
    }

    @Transactional
    public void updateCaptions(Long datasetId, List<com.autocap.backend.dto.CaptionUpdateDto> updates) {
        for (com.autocap.backend.dto.CaptionUpdateDto update : updates) {
            captionRepository.updateCaptionText(update.getId(), update.getNewText());
        }
    }

    @Transactional
    public void deleteDatasetItems(Long datasetId, List<Long> captionIds) {
        if (captionIds == null || captionIds.isEmpty()) return;

        // 1. Remove bridge-table rows first (no FK dependents)
        datasetItemRepository.deleteByIdDatasetIdAndIdCaptionIdIn(datasetId, captionIds);
        datasetItemRepository.flush();

        // 2. Delete captions (they reference images, so safe to delete after bridge rows)
        captionRepository.deleteAllById(captionIds);
        captionRepository.flush();

        // 3. Update dataset item count
        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new DatasetNotFoundException("Dataset not found"));
        dataset.setTotalItems(datasetItemRepository.findAllByIdDatasetId(datasetId).size());
        datasetRepository.save(dataset);
    }

    /**
     * Returns all datasets belonging to the given user.
     */
    @Transactional(readOnly = true)
    public List<com.autocap.backend.dto.MyDatasetDto> getAllUserDatasets(User user) {
        return datasetRepository.findAllByUser(user).stream()
                .map(d -> com.autocap.backend.dto.MyDatasetDto.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .description(d.getDescription())
                        .totalItems(d.getTotalItems())
                        .averageSimilarity(d.getAverageSimilarity())
                        .isPublic(d.getIsPublic())
                        .format(d.getFormat())
                        .createdAt(d.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Updates a dataset's name, description, and visibility.
     */
    @Transactional
    public void updateDataset(Long datasetId, com.autocap.backend.dto.DatasetUpdateRequest request) {
        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new DatasetNotFoundException("Dataset not found"));
        if (request.getName() != null) dataset.setName(request.getName());
        if (request.getDescription() != null) dataset.setDescription(request.getDescription());
        if (request.getIsPublic() != null) dataset.setIsPublic(request.getIsPublic());
        datasetRepository.save(dataset);
    }

    /**
     * Completely deletes a dataset and all related records (dataset_items, captions, images).
     */
    @Transactional
    public void deleteEntireDataset(Long datasetId) {
        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new DatasetNotFoundException("Dataset not found"));

        List<DatasetItem> items = datasetItemRepository.findAllByIdDatasetId(datasetId);
        List<Long> captionIds = items.stream().map(i -> i.getId().getCaptionId()).distinct().collect(Collectors.toList());
        List<Long> imageIds = items.stream().map(i -> i.getId().getImageId()).distinct().collect(Collectors.toList());

        // 1. Delete bridge-table rows
        for (DatasetItem item : items) {
            datasetItemRepository.delete(item);
        }
        datasetItemRepository.flush();

        // 2. Delete captions
        if (!captionIds.isEmpty()) {
            captionRepository.deleteAllById(captionIds);
            captionRepository.flush();
        }

        // 3. Delete images
        if (!imageIds.isEmpty()) {
            imageRepository.deleteAllById(imageIds);
            imageRepository.flush();
        }

        // 4. Delete the dataset itself
        datasetRepository.delete(dataset);
    }

    /** Thrown when a requested dataset does not exist. */
    public static class DatasetNotFoundException extends RuntimeException {
        public DatasetNotFoundException(String message) {
            super(message);
        }
    }
}
