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

    /** Thrown when a requested dataset does not exist. */
    public static class DatasetNotFoundException extends RuntimeException {
        public DatasetNotFoundException(String message) {
            super(message);
        }
    }
}
