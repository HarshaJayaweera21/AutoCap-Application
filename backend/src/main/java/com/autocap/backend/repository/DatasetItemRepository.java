package com.autocap.backend.repository;

import com.autocap.backend.entity.DatasetItem;
import com.autocap.backend.entity.DatasetItemId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DatasetItemRepository extends JpaRepository<DatasetItem, DatasetItemId> {
    List<DatasetItem> findAllByIdDatasetId(Long datasetId);
}
