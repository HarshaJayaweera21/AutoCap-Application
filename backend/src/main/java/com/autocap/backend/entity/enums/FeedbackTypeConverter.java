package com.autocap.backend.entity.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class FeedbackTypeConverter implements AttributeConverter<FeedbackType, String> {

    @Override
    public String convertToDatabaseColumn(FeedbackType attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public FeedbackType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : FeedbackType.fromDbValue(dbData);
    }
}
