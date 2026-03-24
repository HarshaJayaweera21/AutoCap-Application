package com.autocap.backend.config;

import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
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

    /**
     * Raises Tomcat's multipart part count limit from the restrictive default
     * to 100, allowing up to 50 files + metadata fields in a single request.
     * Without this, Tomcat throws FileCountLimitExceededException on batch uploads.
     */
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            // Allow up to 100 multipart parts (50 image files + form field params)
            connector.setMaxPartCount(100);
        });
    }
}
