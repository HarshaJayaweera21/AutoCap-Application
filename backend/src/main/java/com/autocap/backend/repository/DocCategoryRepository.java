package com.autocap.backend.repository;

import com.autocap.backend.entity.DocCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DocCategoryRepository extends JpaRepository<DocCategory, UUID> {

    boolean existsByOrderIndex(Integer orderIndex);

    boolean existsByOrderIndexAndIdNot(Integer orderIndex, UUID id);
}
