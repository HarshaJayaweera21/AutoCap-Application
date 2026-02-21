package com.autocap.backend.entity.enums;

/**
 * Maps the check constraint on images.flag_status:
 * 'Clean' | 'Flagged' | 'Rejected'
 * Stored in DB with exact capitalisation via EnumType.STRING.
 */
public enum FlagStatus {
    Clean,
    Flagged,
    Rejected
}
