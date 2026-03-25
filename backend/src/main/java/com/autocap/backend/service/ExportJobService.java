package com.autocap.backend.service;

import com.autocap.backend.dto.ExportStatusDto;
import com.autocap.backend.dto.PublicCaptionSearchProjection;
import com.autocap.backend.repository.CaptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportJobService {
    
    private final CaptionRepository captionRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    
    private final Map<String, ExportStatusDto> jobStatuses = new ConcurrentHashMap<>();
    private final Map<String, Path> jobFiles = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newFixedThreadPool(5);
    
    private static final String SUPABASE_BASE = "https://mztbiewiqjnairxnurfk.supabase.co/storage/v1/object/public/Images/";

    public String startExportJob(List<Long> captionIds) {
        String jobId = UUID.randomUUID().toString();
        
        jobStatuses.put(jobId, ExportStatusDto.builder()
                .jobId(jobId)
                .status("STARTING")
                .progress(0)
                .message("Initializing export job...")
                .downloadReady(false)
                .build());
                
        executorService.submit(() -> runExportTask(jobId, captionIds));
        return jobId;
    }

    public ExportStatusDto getJobStatus(String jobId) {
        return jobStatuses.get(jobId);
    }
    
    public Path getJobFile(String jobId) {
        return jobFiles.get(jobId);
    }

    private void runExportTask(String jobId, List<Long> captionIds) {
        try {
            updateStatus(jobId, "PREPARING", 5, "Fetching metadata...");
            List<PublicCaptionSearchProjection> items = captionRepository.findCaptionsByIds(captionIds);
            
            Path tempZipFile = Files.createTempFile("export-" + jobId + "-", ".zip");
            jobFiles.put(jobId, tempZipFile);
            
            try (FileOutputStream fos = new FileOutputStream(tempZipFile.toFile());
                 ZipOutputStream zos = new ZipOutputStream(new BufferedOutputStream(fos))) {
                 
                updateStatus(jobId, "CREATING_CSV", 10, "Generating CSV metadata...");
                StringBuilder csvContent = new StringBuilder();
                csvContent.append("image_name,caption\n");
                
                int total = items.size();
                int current = 0;
                
                updateStatus(jobId, "DOWNLOADING_IMAGES", 15, "Downloading 0 / " + total + " images");
                
                for (PublicCaptionSearchProjection item : items) {
                    if (item.getOriginalName() != null) {
                        String imageUrl = SUPABASE_BASE + item.getOriginalName();
                        
                        try {
                            byte[] imageBytes = restTemplate.getForObject(imageUrl, byte[].class);
                            if (imageBytes != null) {
                                zos.putNextEntry(new ZipEntry("images/" + item.getOriginalName()));
                                zos.write(imageBytes);
                                zos.closeEntry();
                                
                                String cleanCaption = item.getCaptionText() != null ? item.getCaptionText().replace("\"", "\"\"") : "";
                                csvContent.append("\"").append(item.getOriginalName()).append("\",\"")
                                          .append(cleanCaption).append("\"\n");
                            }
                        } catch (Exception e) {
                            log.error("Failed to download image {}", imageUrl, e);
                        }
                    }
                    current++;
                    int progress = 15 + (int) ((current / (double) total) * 70); // 15% to 85%
                    updateStatus(jobId, "ZIPPING", progress, "Zipped " + current + " / " + total + " images...");
                }
                
                updateStatus(jobId, "FINALIZING", 88, "Adding metadata CSV to zip...");
                zos.putNextEntry(new ZipEntry("export.csv"));
                zos.write(csvContent.toString().getBytes("UTF-8"));
                zos.closeEntry();
            }
            
            updateStatus(jobId, "COMPLETED", 90, "Export ready for download.");
            ExportStatusDto finalStatus = jobStatuses.get(jobId);
            finalStatus.setDownloadReady(true);
            
        } catch (Exception e) {
            log.error("Job " + jobId + " failed", e);
            updateStatus(jobId, "FAILED", 0, "Failed to build export: " + e.getMessage());
        }
    }
    
    private void updateStatus(String jobId, String status, int progress, String message) {
        ExportStatusDto dto = jobStatuses.get(jobId);
        if (dto != null) {
            dto.setStatus(status);
            dto.setProgress(progress);
            dto.setMessage(message);
        }
    }
}
