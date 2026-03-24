package com.autocap.backend.repository;

import com.autocap.backend.entity.Tokenizer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TokenizerRepository extends JpaRepository<Tokenizer, UUID> {
    List<Tokenizer> findAllByOrderByOrderIndexAsc();
}
