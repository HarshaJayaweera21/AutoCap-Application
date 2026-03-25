package com.autocap.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class BatchCaptionUpdateRequest {
    private List<CaptionUpdateDto> updates;
}
