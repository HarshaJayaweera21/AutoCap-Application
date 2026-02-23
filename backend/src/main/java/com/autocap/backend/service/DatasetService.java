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
import org.springframework.stereotype.Service;

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
     * Builds an in-memory ZIP containing a captions.txt for the given dataset.
     * Each line in captions.txt is: <original_image_name>\t<caption_text>
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

            // --- captions.txt and physical images ---
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

                // Write the image file into the ZIP archive if it exists
                if (item.getImage() != null && item.getImage().getFilePath() != null) {
                    Path physicalPath = Paths.get(item.getImage().getFilePath());
                    if (Files.exists(physicalPath) && Files.isReadable(physicalPath)) {
                        try {
                            ZipEntry imageEntry = new ZipEntry(originalName);
                            zos.putNextEntry(imageEntry);
                            Files.copy(physicalPath, zos);
                            zos.closeEntry();
                        } catch (IOException e) {
                            log.warn("Failed to zip image file {}, skipping it.", physicalPath, e);
                            try {
                                zos.closeEntry();
                            } catch (Exception ignored) {
                            }
                        }
                    } else {
                        log.warn("Image file not found on disk: {}", physicalPath);
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

    /** Thrown when a requested dataset does not exist. */
    public static class DatasetNotFoundException extends RuntimeException {
        public DatasetNotFoundException(String message) {
            super(message);
        }
    }
}
