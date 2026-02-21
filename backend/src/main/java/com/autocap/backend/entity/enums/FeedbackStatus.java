package com.autocap.backend.entity.enums;

/**
 * Maps the check constraint on feedback.status:
 * 'New' | 'In Review' | 'Resolved' | 'Won''t Fix'
 * Multi-word values require a JPA AttributeConverter – see
 * FeedbackStatusConverter.
 */
public enum FeedbackStatus {
    NEW("New"),
    IN_REVIEW("In Review"),
    RESOLVED("Resolved"),
    WONT_FIX("Won't Fix");

    private final String dbValue;

    FeedbackStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static FeedbackStatus fromDbValue(String value) {
        for (FeedbackStatus status : values()) {
            if (status.dbValue.equals(value))
                return status;
        }
        throw new IllegalArgumentException("Unknown FeedbackStatus: " + value);
    }
}
