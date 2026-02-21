package com.autocap.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class DatasetItemId implements Serializable {

    @Column(name = "dataset_id", nullable = false)
    private Long datasetId;

    @Column(name = "image_id", nullable = false)
    private Long imageId;

    @Column(name = "caption_id", nullable = false)
    private Long captionId;
}
