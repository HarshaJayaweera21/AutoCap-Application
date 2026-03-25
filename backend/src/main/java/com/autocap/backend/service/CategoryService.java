package com.autocap.backend.service;

import com.autocap.backend.dto.CategoryResponseDTO;
import com.autocap.backend.dto.admin.CreateCategoryRequest;
import com.autocap.backend.dto.admin.UpdateCategoryRequest;
import com.autocap.backend.entity.DocCategory;
import com.autocap.backend.exception.NotFoundException;
import com.autocap.backend.repository.DocCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
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

    public CategoryResponseDTO createCategory(CreateCategoryRequest request) {
        DocCategory category = new DocCategory();
        category.setName(request.getName());
        category.setOrderIndex(request.getOrderIndex());

        DocCategory saved = categoryRepository.save(category);
        return toDTO(saved);
    }

    public CategoryResponseDTO updateCategory(UUID id, UpdateCategoryRequest request) {
        DocCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + id));

        category.setName(request.getName());
        category.setOrderIndex(request.getOrderIndex());

        DocCategory saved = categoryRepository.save(category);
        return toDTO(saved);
    }

    public void deleteCategory(UUID id) {
        DocCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + id));
        categoryRepository.delete(category);
    }

    private CategoryResponseDTO toDTO(DocCategory entity) {
        return CategoryResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .orderIndex(entity.getOrderIndex())
                .build();
    }
}
