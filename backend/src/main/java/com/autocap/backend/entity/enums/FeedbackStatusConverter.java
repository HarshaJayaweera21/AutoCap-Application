package com.autocap.backend.entity.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class FeedbackStatusConverter implements AttributeConverter<FeedbackStatus, String> {

    @Override
    public String convertToDatabaseColumn(FeedbackStatus attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public FeedbackStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : FeedbackStatus.fromDbValue(dbData);
    }
}
