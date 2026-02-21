package com.autocap.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doc_tag_map")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocTagMap {

    @EmbeddedId
    private DocTagMapId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("docId")
    @JoinColumn(name = "doc_id", foreignKey = @ForeignKey(name = "fk_doc_tag_doc"))
    private Doc doc;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tagId")
    @JoinColumn(name = "tag_id", foreignKey = @ForeignKey(name = "fk_doc_tag_tag"))
    private DocTag tag;
}
