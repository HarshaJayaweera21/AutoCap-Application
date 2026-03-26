package com.autocap.backend.repository;

import com.autocap.backend.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    // Find all feedback submitted by a specific user
    List<Feedback> findByUser_Id(Long userId);

    /**
     * Flexible filtered query used by the service layer.
     * All filters are optional — pass null to skip each filter.
     * Results are ordered by newest first (null-safe: null createdAt comes last).
     *
     * Note: type and status are compared as strings because the JPA converters
     * store them as their DB string values.
     */
    @Query("""
            SELECT f FROM Feedback f
            WHERE (:type IS NULL OR CAST(f.type AS string) = :type)
              AND (:status IS NULL OR CAST(f.status AS string) = :status)
              AND (:search IS NULL OR :search = ''
                   OR LOWER(f.subject) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(f.message) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY f.createdAt DESC NULLS LAST
            """)
    List<Feedback> findFiltered(
            @Param("type") String type,
            @Param("status") String status,
            @Param("search") String search);
}