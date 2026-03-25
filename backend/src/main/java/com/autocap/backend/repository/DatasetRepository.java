package com.autocap.backend.repository;

import com.autocap.backend.entity.Dataset;
import com.autocap.backend.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface DatasetRepository extends JpaRepository<Dataset, Long> {

    @Query("SELECT d FROM Dataset d WHERE d.user = :user AND d.deletedAt IS NULL ORDER BY d.createdAt DESC")
    List<Dataset> findRecentByUser(@Param("user") User user, Pageable pageable);

    @Query("SELECT d FROM Dataset d WHERE d.user = :user AND d.deletedAt IS NULL ORDER BY d.createdAt DESC")
    List<Dataset> findAllByUser(@Param("user") User user);

    long countByCreatedAtBetween(OffsetDateTime start, OffsetDateTime end);
}
