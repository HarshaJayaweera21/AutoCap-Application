package com.autocap.backend.repository;

import com.autocap.backend.entity.Dataset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface DatasetRepository extends JpaRepository<Dataset, Long> {

    long countByCreatedAtBetween(Instant start, Instant end);
}
