package com.autocap.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class ExportRequestDto {
    private List<Long> captionIds;
}
