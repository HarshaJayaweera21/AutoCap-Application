package com.autocap.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Handles uploads to and retrievals from the Supabase "Images" storage bucket
 * using the Supabase Storage REST API with the service-role key.
 *
 * IMPORTANT: object paths must already be URL-safe (no spaces or special chars)
 * before being passed to this service, because RestTemplate would double-encode
 * any pre-encoded strings.  Callers should sanitize filenames beforehand.
 */
@Service
@Slf4j
public class SupabaseStorageService {

    private static final String BUCKET = "Images";

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-key}")
    private String supabaseServiceKey;

    private final RestTemplate restTemplate;

    public SupabaseStorageService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Uploads a file to Supabase Storage and returns the public URL.
     *
     * @param objectPath the storage path inside the bucket, e.g. "42/1234567890_photo.jpg"
     *                   Must be URL-safe (no spaces, parentheses, etc.).
     * @param file       the multipart file to upload
     * @return the public URL for the uploaded file
     */
    public String upload(String objectPath, MultipartFile file) {
        // Path is already sanitized by the caller — no encoding here to avoid double-encoding
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + objectPath;
        log.info("Uploading to Supabase Storage: {}", uploadUrl);

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file bytes for upload: " + objectPath, e);
        }

        String contentType = (file.getContentType() != null)
                ? file.getContentType()
                : "application/octet-stream";

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", supabaseServiceKey);
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentLength(bytes.length);
        headers.set("x-upsert", "true"); // Allow overwrite on retry

        // Send raw byte[] — RestTemplate serialises this correctly with Content-Length
        HttpEntity<byte[]> entity = new HttpEntity<>(bytes, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    uploadUrl, HttpMethod.POST, entity, String.class);
            log.info("Supabase upload succeeded ({}): {}", response.getStatusCode(), objectPath);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("Supabase Storage upload HTTP error {} for {}: {}",
                    e.getStatusCode(), objectPath, e.getResponseBodyAsString());
            throw new RuntimeException(
                    "Supabase Storage upload failed (" + e.getStatusCode() + "): " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Supabase Storage upload unexpected error for {}", objectPath, e);
            throw new RuntimeException("Supabase Storage upload failed for: " + objectPath, e);
        }

        return getPublicUrl(objectPath);
    }

    /**
     * Deletes a file from Supabase Storage.
     *
     * @param objectPath the storage path inside the bucket (URL-safe)
     */
    public void delete(String objectPath) {
        String deleteUrl = supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + objectPath;
        log.info("Deleting from Supabase Storage: {}", deleteUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", supabaseServiceKey);
        headers.set("Authorization", "Bearer " + supabaseServiceKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            restTemplate.exchange(deleteUrl, HttpMethod.DELETE, entity, String.class);
            log.info("Deleted from Supabase Storage: {}", objectPath);
        } catch (Exception e) {
            log.warn("Could not delete file from Supabase Storage: {}", objectPath, e);
        }
    }

    /**
     * Returns the public URL for a stored object.
     * The bucket is public so no auth token is needed for reads.
     */
    public String getPublicUrl(String objectPath) {
        return supabaseUrl + "/storage/v1/object/public/" + BUCKET + "/" + objectPath;
    }
}
