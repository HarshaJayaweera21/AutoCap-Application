package com.autocap.backend.repository;

import com.autocap.backend.entity.Doc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocRepository extends JpaRepository<Doc, UUID> {

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    @Query("SELECT d FROM Doc d WHERE LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(d.content) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Doc> searchByTitleOrContent(@Param("q") String query);
}
