package com.autocap.backend.controller;

import com.autocap.backend.dto.DocResponseDTO;
import com.autocap.backend.service.DocService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/docs")
@RequiredArgsConstructor
public class DocController {

    private final DocService docService;

    @GetMapping
    public ResponseEntity<List<DocResponseDTO>> getAllDocs() {
        return ResponseEntity.ok(docService.getAllDocs());
    }

    @GetMapping("/search")
    public ResponseEntity<List<DocResponseDTO>> searchDocs(@RequestParam("q") String query) {
        return ResponseEntity.ok(docService.searchDocs(query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocResponseDTO> getDocById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(docService.getDocById(id));
    }
}
