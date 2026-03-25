package com.autocap.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class DeleteItemsRequest {
    private List<Long> captionIds;
}
