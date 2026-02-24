package com.autocap.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "doc_tag_map")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(DocTagMapId.class)
public class DocTagMap {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doc_id", nullable = false)
    private Doc doc;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id", nullable = false)
    private DocTag tag;
}
