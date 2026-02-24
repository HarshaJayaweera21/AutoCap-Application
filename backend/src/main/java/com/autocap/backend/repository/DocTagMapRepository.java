package com.autocap.backend.repository;

import com.autocap.backend.entity.DocTagMap;
import com.autocap.backend.entity.DocTagMapId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocTagMapRepository extends JpaRepository<DocTagMap, DocTagMapId> {
    List<DocTagMap> findByDocId(UUID docId);
}
