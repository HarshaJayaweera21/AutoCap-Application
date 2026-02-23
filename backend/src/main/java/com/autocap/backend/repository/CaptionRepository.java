package com.autocap.backend.repository;

import com.autocap.backend.entity.Caption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CaptionRepository extends JpaRepository<Caption, Long> {
}
