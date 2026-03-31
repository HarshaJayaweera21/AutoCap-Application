package com.autocap.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource("classpath:application.properties")
public class FileStorageConfig {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.upload.max-size}")
    private String maxFileSize;

    public String getUploadDir() {
        return uploadDir;
    }

    public String getMaxFileSize() {
        return maxFileSize;
    }
}