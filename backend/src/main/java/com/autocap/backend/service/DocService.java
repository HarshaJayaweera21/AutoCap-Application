package com.autocap.backend.service;

import com.autocap.backend.dto.DocResponseDTO;
import com.autocap.backend.dto.admin.CreateDocRequest;
import com.autocap.backend.dto.admin.UpdateDocRequest;
import com.autocap.backend.entity.Doc;
import com.autocap.backend.entity.DocCategory;
import com.autocap.backend.entity.DocTag;
import com.autocap.backend.entity.DocTagMap;
import com.autocap.backend.exception.NotFoundException;
import com.autocap.backend.exception.SlugAlreadyExistsException;
import com.autocap.backend.repository.DocCategoryRepository;
import com.autocap.backend.repository.DocRepository;
import com.autocap.backend.repository.DocTagMapRepository;
import com.autocap.backend.repository.DocTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocService {

    private final DocRepository docRepository;
    private final DocCategoryRepository categoryRepository;
    private final DocTagRepository tagRepository;
    private final DocTagMapRepository tagMapRepository;

    // ==================== READ ====================

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

    public List<DocResponseDTO> searchDocs(String query) {
        return docRepository.searchByTitleOrContent(query)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ==================== CREATE ====================

    @Transactional
    public DocResponseDTO createDoc(CreateDocRequest request) {
        // 1. Check slug uniqueness
        if (docRepository.existsBySlug(request.getSlug())) {
            throw new SlugAlreadyExistsException("Slug already exists: " + request.getSlug());
        }

        // 2. Fetch category
        DocCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + request.getCategoryId()));

        // 3. Fetch and validate tags
        List<DocTag> tags = new ArrayList<>();
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            tags = tagRepository.findAllById(request.getTagIds());
            if (tags.size() != request.getTagIds().size()) {
                throw new NotFoundException("One or more tag IDs are invalid");
            }
        }

        // 4. Create and save doc entity
        Doc doc = new Doc();
        doc.setTitle(request.getTitle());
        doc.setSlug(request.getSlug());
        doc.setContent(request.getContent());
        doc.setEndpoint(request.getEndpoint());
        doc.setOrderIndex(request.getOrderIndex());
        doc.setCategory(category);

        Doc savedDoc = docRepository.save(doc);

        // 5. Create tag mappings
        for (DocTag tag : tags) {
            DocTagMap mapping = new DocTagMap();
            mapping.setDoc(savedDoc);
            mapping.setTag(tag);
            tagMapRepository.save(mapping);
        }

        // 6. Reload doc to get tag mappings populated
        Doc reloadedDoc = docRepository.findById(savedDoc.getId())
                .orElseThrow(() -> new NotFoundException("Doc not found after save"));
        return toDTO(reloadedDoc);
    }

    // ==================== UPDATE ====================

    @Transactional
    public DocResponseDTO updateDoc(UUID id, UpdateDocRequest request) {
        // 1. Fetch existing doc
        Doc doc = docRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Doc not found with id: " + id));

        // 2. Check slug uniqueness (excluding current doc)
        if (docRepository.existsBySlugAndIdNot(request.getSlug(), id)) {
            throw new SlugAlreadyExistsException("Slug already exists: " + request.getSlug());
        }

        // 3. Fetch category
        DocCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + request.getCategoryId()));

        // 4. Fetch and validate tags
        List<DocTag> tags = new ArrayList<>();
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            tags = tagRepository.findAllById(request.getTagIds());
            if (tags.size() != request.getTagIds().size()) {
                throw new NotFoundException("One or more tag IDs are invalid");
            }
        }

        // 5. Update doc fields
        doc.setTitle(request.getTitle());
        doc.setSlug(request.getSlug());
        doc.setContent(request.getContent());
        doc.setEndpoint(request.getEndpoint());
        doc.setOrderIndex(request.getOrderIndex());
        doc.setCategory(category);

        docRepository.save(doc);

        // 6. Clear old tag mappings and create new ones
        tagMapRepository.deleteByDocId(id);

        for (DocTag tag : tags) {
            DocTagMap mapping = new DocTagMap();
            mapping.setDoc(doc);
            mapping.setTag(tag);
            tagMapRepository.save(mapping);
        }

        // 7. Reload and return
        Doc reloadedDoc = docRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Doc not found after update"));
        return toDTO(reloadedDoc);
    }

    // ==================== DELETE ====================

    @Transactional
    public void deleteDoc(UUID id) {
        // 1. Check doc exists
        Doc doc = docRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Doc not found with id: " + id));

        // 2. Delete tag mappings first
        tagMapRepository.deleteByDocId(id);

        // 3. Delete doc
        docRepository.delete(doc);
    }

    // ==================== DTO MAPPER ====================

    private DocResponseDTO toDTO(Doc doc) {
        List<String> tags = doc.getTagMappings() != null
                ? doc.getTagMappings()
                        .stream()
                        .map(mapping -> mapping.getTag().getName())
                        .toList()
                : List.of();

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
