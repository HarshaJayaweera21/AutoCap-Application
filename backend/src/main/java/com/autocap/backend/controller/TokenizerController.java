package com.autocap.backend.controller;

import com.autocap.backend.entity.Tokenizer;
import com.autocap.backend.service.TokenizerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tokenizers")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class TokenizerController {

    private final TokenizerService tokenizerService;

    @GetMapping
    public ResponseEntity<List<Tokenizer>> getAllTokenizers() {
        return ResponseEntity.ok(tokenizerService.getAllTokenizers());
    }
}
