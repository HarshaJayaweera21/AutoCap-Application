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
    List<Feedback> findByUserId(Long userId);

    // Find feedback by status (e.g., 'New', 'In Review')
    List<Feedback> findByStatus(String status);

    // Find feedback by type (e.g., 'Bug Report')
    List<Feedback> findByType(String type);

    // Find feedback by type and status
    List<Feedback> findByTypeAndStatus(String type, String status);

    /**
     * Flexible filtered query used by the service layer.
     * All filters are optional — pass null to skip each filter.
     * Results are ordered by newest first (null-safe: null createdAt comes last).
     */
    @Query("""
            SELECT f FROM Feedback f
            WHERE (:type IS NULL OR f.type = :type)
              AND (:status IS NULL OR f.status = :status)
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