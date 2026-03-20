package com.autocap.backend.controller;

import com.autocap.backend.entity.Tokenizer;
import com.autocap.backend.service.TokenizerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/tokenizers")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminTokenizerController {

    private final TokenizerService tokenizerService;

    @PostMapping
    public ResponseEntity<Tokenizer> create(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String modelKey = (String) body.get("modelKey");
        String description = (String) body.getOrDefault("description", "");
        int orderIndex = body.containsKey("orderIndex") ? ((Number) body.get("orderIndex")).intValue() : 0;

        Tokenizer tokenizer = tokenizerService.createTokenizer(name, modelKey, description, orderIndex);
        return ResponseEntity.status(HttpStatus.CREATED).body(tokenizer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        tokenizerService.deleteTokenizer(id);
        return ResponseEntity.noContent().build();
    }
}
