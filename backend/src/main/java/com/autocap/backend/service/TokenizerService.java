package com.autocap.backend.service;

import com.autocap.backend.entity.Tokenizer;
import com.autocap.backend.repository.TokenizerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenizerService {

    private final TokenizerRepository tokenizerRepository;

    public List<Tokenizer> getAllTokenizers() {
        return tokenizerRepository.findAllByOrderByOrderIndexAsc();
    }

    public Tokenizer createTokenizer(String name, String modelKey, String description, int orderIndex) {
        Tokenizer tokenizer = new Tokenizer();
        tokenizer.setName(name);
        tokenizer.setModelKey(modelKey);
        tokenizer.setDescription(description);
        tokenizer.setOrderIndex(orderIndex);
        return tokenizerRepository.save(tokenizer);
    }

    public void deleteTokenizer(UUID id) {
        tokenizerRepository.deleteById(id);
    }
}
