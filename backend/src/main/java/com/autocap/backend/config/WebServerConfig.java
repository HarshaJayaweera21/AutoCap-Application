package com.autocap.backend.config;

import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
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
     * Customizes Tomcat to allow more multipart parts in a single request,
     * enabling up to 50 files + metadata fields in a single batch upload.
     */
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            // Allow larger max post size for batch uploads (100MB)
            connector.setMaxPostSize(100 * 1024 * 1024);
        });
    }
}
