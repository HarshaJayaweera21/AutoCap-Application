package com.autocap.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.web.multipart.support.MultipartFilter;

@Configuration
public class WebServerConfig {

    /**
     * Registers the MultipartFilter BEFORE Spring Security so that multipart
     * requests (file uploads) are parsed before the security filter chain reads
     * the request body. Without this ordering, batch uploads trigger a
     * MaxUploadSizeExceededException before reaching the controller.
     */
    @Bean
    @Order(0)
    public MultipartFilter multipartFilter() {
        return new MultipartFilter();
    }
}
