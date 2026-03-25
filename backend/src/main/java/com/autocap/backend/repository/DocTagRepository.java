package com.autocap.backend.repository;

import com.autocap.backend.entity.DocTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DocTagRepository extends JpaRepository<DocTag, UUID> {
}
