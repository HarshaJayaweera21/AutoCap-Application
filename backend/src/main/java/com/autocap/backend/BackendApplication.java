package com.autocap.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
public class BackendApplication {
    public static void main(String[] args) {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

        SpringApplication.run(BackendApplication.class, args);
        System.out.println("========================================");
        System.out.println("AutoCap Backend Started Successfully!");
        System.out.println("Port: 8080");
        System.out.println("H2 Console: http://localhost:8080/h2-console");
        System.out.println("API Base: http://localhost:8080/api/feedback");
        System.out.println("========================================");
    }
}