package com.autocap.backend.repository;

import com.autocap.backend.entity.Caption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface CaptionRepository extends JpaRepository<Caption, Long> {

    // ── Row 1: Total counts ──

    long countByImage_IsFlaggedFalse();

    long countByImage_IsFlaggedTrue();

    // ── Row 1: Weekly comparison counts ──

    long countByCreatedAtBetween(Instant start, Instant end);

    long countByImage_IsFlaggedFalseAndCreatedAtBetween(Instant start, Instant end);

    long countByImage_IsFlaggedTrueAndCreatedAtBetween(Instant start, Instant end);

    // ── Row 2: Captions per day (last 30 days) ──

    @Query(value = """
            SELECT CAST(c.created_at AS DATE) AS caption_date, COUNT(*) AS caption_count
            FROM captions c
            WHERE c.created_at >= :since
            GROUP BY CAST(c.created_at AS DATE)
            ORDER BY caption_date
            """, nativeQuery = true)
    List<Object[]> countCaptionsPerDaySince(@Param("since") Instant since);

    // ── Row 3: Similarity statistics ──

    @Query("SELECT AVG(c.similarityScore) FROM Caption c WHERE c.similarityScore IS NOT NULL")
    Double findAverageSimilarityScore();

    @Query("SELECT MAX(c.similarityScore) FROM Caption c WHERE c.similarityScore IS NOT NULL")
    Double findMaxSimilarityScore();

    @Query("SELECT MIN(c.similarityScore) FROM Caption c WHERE c.similarityScore IS NOT NULL")
    Double findMinSimilarityScore();

    // ── Row 3: Similarity distribution (5 buckets) ──

    @Query(value = """
            SELECT
                CASE
                    WHEN similarity_score >= 0.0 AND similarity_score < 0.2 THEN '0.0-0.2'
                    WHEN similarity_score >= 0.2 AND similarity_score < 0.4 THEN '0.2-0.4'
                    WHEN similarity_score >= 0.4 AND similarity_score < 0.6 THEN '0.4-0.6'
                    WHEN similarity_score >= 0.6 AND similarity_score < 0.8 THEN '0.6-0.8'
                    WHEN similarity_score >= 0.8 AND similarity_score <= 1.0 THEN '0.8-1.0'
                END AS score_range,
                COUNT(*) AS bucket_count
            FROM captions
            WHERE similarity_score IS NOT NULL
            GROUP BY score_range
            ORDER BY score_range
            """, nativeQuery = true)
    List<Object[]> findSimilarityDistribution();
    // ── Row 4: Public Dataset Search ──

    @Query(value = """
            SELECT c.id AS "captionId", i.id AS "imageId", i.original_name AS "originalName",
                   c.caption_text AS "captionText", c.similarity_score AS "similarityScore",
                   i.is_flagged AS "isFlagged"
            FROM datasets d
            JOIN dataset_items di ON d.id = di.dataset_id
            JOIN captions c ON di.caption_id = c.id
            JOIN images i ON c.image_id = i.id
            WHERE d.is_public = true 
              AND c.caption_text ILIKE CONCAT('%', :query, '%')
            """,
            countQuery = """
            SELECT count(*)
            FROM datasets d
            JOIN dataset_items di ON d.id = di.dataset_id
            JOIN captions c ON di.caption_id = c.id
            WHERE d.is_public = true 
              AND c.caption_text ILIKE CONCAT('%', :query, '%')
            """,
            nativeQuery = true)
    org.springframework.data.domain.Page<com.autocap.backend.dto.PublicCaptionSearchProjection> searchPublicCaptions(
            @Param("query") String query,
            org.springframework.data.domain.Pageable pageable);

    @Query(value = """
            SELECT c.id AS "captionId", i.id AS "imageId", i.original_name AS "originalName",
                   c.caption_text AS "captionText", c.similarity_score AS "similarityScore",
                   i.is_flagged AS "isFlagged"
            FROM datasets d
            JOIN dataset_items di ON d.id = di.dataset_id
            JOIN captions c ON di.caption_id = c.id
            JOIN images i ON c.image_id = i.id
            WHERE c.id IN :captionIds
            """, nativeQuery = true)
    List<com.autocap.backend.dto.PublicCaptionSearchProjection> findCaptionsByIds(@Param("captionIds") List<Long> captionIds);
}

