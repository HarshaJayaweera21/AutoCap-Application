package com.autocap.backend.controller;

import com.autocap.backend.dto.DocResponseDTO;
import com.autocap.backend.dto.admin.CreateDocRequest;
import com.autocap.backend.dto.admin.UpdateDocRequest;
import com.autocap.backend.service.DocService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/docs")
@RequiredArgsConstructor
public class AdminDocController {

    private final DocService docService;

    @PostMapping
    public ResponseEntity<DocResponseDTO> createDoc(@Valid @RequestBody CreateDocRequest request) {
        DocResponseDTO created = docService.createDoc(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocResponseDTO> updateDoc(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateDocRequest request) {
        DocResponseDTO updated = docService.updateDoc(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDoc(@PathVariable("id") UUID id) {
        docService.deleteDoc(id);
        return ResponseEntity.noContent().build();
    }
}
