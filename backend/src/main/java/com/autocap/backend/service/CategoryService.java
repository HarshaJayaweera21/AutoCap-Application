package com.autocap.backend.service;

import com.autocap.backend.dto.CategoryResponseDTO;
import com.autocap.backend.entity.DocCategory;
import com.autocap.backend.repository.DocCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final DocCategoryRepository categoryRepository;

    public List<CategoryResponseDTO> getAllCategories() {
        return categoryRepository.findAll(Sort.by("orderIndex"))
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private CategoryResponseDTO toDTO(DocCategory entity) {
        return CategoryResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .orderIndex(entity.getOrderIndex())
                .build();
    }
}
