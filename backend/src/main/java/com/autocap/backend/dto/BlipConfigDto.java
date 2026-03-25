package com.autocap.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlipConfigDto {
    private String modelVariant = "blip-base";
    private double temperature = 1.0;
    private int maxLength = 50;
    private int minLength = 5;
    private int numBeams = 4;
    private double repetitionPenalty = 1.0;
    private double topP = 0.9;
}
