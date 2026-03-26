package com.autocap.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${spring.servlet.multipart.location:./uploads}")
    private String uploadDir;

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            System.out.println("Upload directory created at: " + this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create upload directory", ex);
        }
    }

    public String storeFile(MultipartFile file, String subDirectory) {
        try {
            Path targetLocation = this.fileStorageLocation;
            if (subDirectory != null && !subDirectory.isEmpty()) {
                targetLocation = this.fileStorageLocation.resolve(subDirectory);
                Files.createDirectories(targetLocation);
            }

            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;

            Path targetPath = targetLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return (subDirectory != null ? subDirectory + "/" : "") + fileName;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + file.getOriginalFilename(), ex);
        }
    }
}