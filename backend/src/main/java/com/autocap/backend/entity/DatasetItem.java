package com.autocap.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dataset_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DatasetItem {

    @EmbeddedId
    private DatasetItemId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("datasetId")
    @JoinColumn(name = "dataset_id", foreignKey = @ForeignKey(name = "fk_dataset_item_dataset"))
    private Dataset dataset;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("imageId")
    @JoinColumn(name = "image_id", foreignKey = @ForeignKey(name = "fk_dataset_item_image"))
    private Image image;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("captionId")
    @JoinColumn(name = "caption_id", foreignKey = @ForeignKey(name = "fk_dataset_item_caption"))
    private Caption caption;
}
