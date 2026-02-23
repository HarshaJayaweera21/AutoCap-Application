package com.autocap.backend.controller;

import com.autocap.backend.dto.BlipConfigDto;
import com.autocap.backend.dto.UploadResponseDto;
import com.autocap.backend.entity.User;
import com.autocap.backend.repository.UserRepository;
import com.autocap.backend.service.ImageUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
@Slf4j
public class ImageUploadController {

        private final ImageUploadService imageUploadService;
        private final UserRepository userRepository;

        @PostMapping("/upload")
        public ResponseEntity<UploadResponseDto> uploadImages(
                        @RequestParam("files[]") MultipartFile[] files,
                        @RequestParam("datasetName") String datasetName,
                        @RequestParam(value = "datasetDescription", required = false, defaultValue = "") String datasetDescription,
                        @RequestParam(value = "modelVariant", required = false, defaultValue = "blip-base") String modelVariant,
                        @RequestParam(value = "temperature", required = false, defaultValue = "1.0") double temperature,
                        @RequestParam(value = "maxLength", required = false, defaultValue = "50") int maxLength,
                        @RequestParam(value = "minLength", required = false, defaultValue = "5") int minLength,
                        @RequestParam(value = "numBeams", required = false, defaultValue = "4") int numBeams,
                        @RequestParam(value = "repetitionPenalty", required = false, defaultValue = "1.0") double repetitionPenalty,
                        @RequestParam(value = "topP", required = false, defaultValue = "0.9") double topP) {
                // Build BlipConfigDto from flat params (avoids ObjectMapper injection issue)
                BlipConfigDto blipConfig = new BlipConfigDto(
                                modelVariant, temperature, maxLength, minLength, numBeams, repetitionPenalty, topP);

                // For now, use the first available user (JWT auth is deferred)
                // User user = userRepository.findAll().stream().findFirst()
                User user = userRepository.findById(5L)
                                .orElseThrow(() -> new RuntimeException(
                                                "No users found in the database. Please create a user first."));

                UploadResponseDto response = imageUploadService.processUpload(
                                files, datasetName, datasetDescription, blipConfig, user);

                return ResponseEntity.ok(response);
        }
}
