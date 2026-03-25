package com.autocap.backend.entity.enums;

/**
 * Maps the check constraint on feedback.type:
 * 'Bug Report' | 'Feature Request' | 'General' | 'Caption Quality'
 * Multi-word values require a JPA AttributeConverter – see
 * FeedbackTypeConverter.
 */
public enum FeedbackType {
    BUG_REPORT("Bug Report"),
    FEATURE_REQUEST("Feature Request"),
    GENERAL("General"),
    CAPTION_QUALITY("Caption Quality");

    private final String dbValue;

    FeedbackType(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static FeedbackType fromDbValue(String value) {
        for (FeedbackType type : values()) {
            if (type.dbValue.equals(value))
                return type;
        }
        throw new IllegalArgumentException("Unknown FeedbackType: " + value);
    }
}
