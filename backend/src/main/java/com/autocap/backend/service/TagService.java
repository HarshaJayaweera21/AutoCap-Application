package com.autocap.backend.service;

import com.autocap.backend.dto.admin.CreateTagRequest;
import com.autocap.backend.entity.DocTag;
import com.autocap.backend.exception.NotFoundException;
import com.autocap.backend.repository.DocTagMapRepository;
import com.autocap.backend.repository.DocTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TagService {

    private final DocTagRepository tagRepository;
    private final DocTagMapRepository tagMapRepository;

    public List<DocTag> getAllTags() {
        return tagRepository.findAll(Sort.by("name"));
    }

    public DocTag createTag(CreateTagRequest request) {
        DocTag tag = new DocTag();
        tag.setName(request.getName());
        return tagRepository.save(tag);
    }

    @Transactional
    public void deleteTag(UUID id) {
        DocTag tag = tagRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tag not found with id: " + id));

        // Remove related mappings first
        tagMapRepository.deleteByTagId(id);

        tagRepository.delete(tag);
    }
}
