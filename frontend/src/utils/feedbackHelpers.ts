import { FeedbackStatus } from '../types/feedback';

/**
 * Maps the status to a user-friendly display string
 */
export const getStatusDisplay = (status: FeedbackStatus): string => {
    const statusMap: Record<FeedbackStatus, string> = {
        'New': 'New',
        'In Review': 'In Review',
        'Resolved': 'Resolved',
        "Won't Fix": "Won't Fix"
    };
    return statusMap[status] || status;
};

/**
 * Maps the status to a specific color class/hex for UI badges
 */
export const getStatusColor = (status: FeedbackStatus): string => {
    const colorMap: Record<FeedbackStatus, string> = {
        'New': '#194BFF', // Primary accent
        'In Review': '#D8EE10', // Secondary highlight
        'Resolved': '#89EB79', // Success
        "Won't Fix": '#E84A34' // Error or Muted
    };
    return colorMap[status] || '#C5C4C7';
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

/**
 * Validates if the file is an image and under 5MB
 */
export const validateImageAttachment = (file: File): { valid: boolean; error?: string } => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'File must be an image.' };
    }
    if (file.size > MAX_SIZE) {
        return { valid: false, error: 'Image must be under 5MB.' };
    }
    return { valid: true };
};
