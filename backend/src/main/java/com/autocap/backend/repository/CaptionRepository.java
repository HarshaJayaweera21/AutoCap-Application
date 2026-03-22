package com.autocap.backend.repository;

import com.autocap.backend.entity.Caption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface CaptionRepository extends JpaRepository<Caption, Long> {

    // ── Row 1: Total counts ──

    long countByImage_IsFlaggedFalse();

    long countByImage_IsFlaggedTrue();

    // ── Row 1: Weekly comparison counts ──

    long countByCreatedAtBetween(OffsetDateTime start, OffsetDateTime end);

    long countByImage_IsFlaggedFalseAndCreatedAtBetween(OffsetDateTime start, OffsetDateTime end);

    long countByImage_IsFlaggedTrueAndCreatedAtBetween(OffsetDateTime start, OffsetDateTime end);

    // ── Row 2: Captions per day (last 30 days) ──

    @Query(value = """
            SELECT CAST(c.created_at AS DATE) AS caption_date, COUNT(*) AS caption_count
            FROM captions c
            WHERE c.created_at >= :since
            GROUP BY CAST(c.created_at AS DATE)
            ORDER BY caption_date
            """, nativeQuery = true)
    List<Object[]> countCaptionsPerDaySince(@Param("since") OffsetDateTime since);

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
}
