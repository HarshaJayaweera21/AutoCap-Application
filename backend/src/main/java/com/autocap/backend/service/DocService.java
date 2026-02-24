package com.autocap.backend.service;

import com.autocap.backend.dto.DocResponseDTO;
import com.autocap.backend.entity.Doc;
import com.autocap.backend.exception.NotFoundException;
import com.autocap.backend.repository.DocRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocService {

    private final DocRepository docRepository;

    public List<DocResponseDTO> getAllDocs() {
        return docRepository.findAll(Sort.by("orderIndex"))
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DocResponseDTO getDocById(UUID id) {
        Doc doc = docRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Doc not found with id: " + id));
        return toDTO(doc);
    }

    private DocResponseDTO toDTO(Doc doc) {
        List<String> tags = doc.getTagMappings()
                .stream()
                .map(mapping -> mapping.getTag().getName())
                .toList();

        return DocResponseDTO.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .slug(doc.getSlug())
                .content(doc.getContent())
                .endpoint(doc.getEndpoint())
                .orderIndex(doc.getOrderIndex())
                .categoryId(doc.getCategory().getId())
                .tags(tags)
                .build();
    }
}
