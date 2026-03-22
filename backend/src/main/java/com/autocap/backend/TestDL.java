package com.autocap.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class TestDL implements CommandLineRunner {
    @Override
    public void run(String... args) throws Exception {
        System.out.println("TESTING DOWNLOAD");
        RestTemplate rt = new RestTemplate();
        try {
            byte[] res = rt.getForObject("https://mztbiewiqjnairxnurfk.supabase.co/storage/v1/object/public/Images/5/1774010661593_Screenshot__271_.png", byte[].class);
            System.out.println("DOWNLOAD SUCCESS: " + (res != null ? res.length : "null"));
        } catch(Exception e) {
            System.err.println("DOWNLOAD FAILED: " + e.getMessage());
        }
    }
}
