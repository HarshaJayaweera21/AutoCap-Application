package com.autocap.backend.repository;

import com.autocap.backend.entity.Doc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DocRepository extends JpaRepository<Doc, UUID> {
}
