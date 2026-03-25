package com.autocap.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class DocTagMapId implements Serializable {

    @Column(name = "doc_id", nullable = false)
    private UUID docId;

    @Column(name = "tag_id", nullable = false)
    private UUID tagId;
}
