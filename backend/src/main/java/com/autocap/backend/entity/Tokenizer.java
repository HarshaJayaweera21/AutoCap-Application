package com.autocap.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "tokenizers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tokenizer {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "model_key", nullable = false, unique = true)
    private String modelKey;

    @Column(name = "description")
    private String description;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;
}
