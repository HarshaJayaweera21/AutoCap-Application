import { useState, useCallback } from 'react';
import { feedbackService } from '../services/feedbackService';
import {
    FeedbackCreateInput,
    FeedbackAdminUpdateInput,
    FeedbackUpdateInput
} from '../types/feedback';

export const useFeedback = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequest = async <T,>(request: () => Promise<T>): Promise<T | null> => {
        setLoading(true);
        setError(null);
        try {
            const data = await request();
            return data;
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getAllFeedback = useCallback((params?: any) => {
        return handleRequest(() => feedbackService.getAllFeedback(params));
    }, []);

    const getFeedbackById = useCallback((id: number) => {
        return handleRequest(() => feedbackService.getFeedbackById(id));
    }, []);

    const createFeedback = useCallback((data: FeedbackCreateInput) => {
        return handleRequest(() => feedbackService.createFeedback(data));
    }, []);

    const getAdminFeedback = useCallback((params?: any) => {
        return handleRequest(() => feedbackService.getAdminFeedback(params));
    }, []);

    const updateFeedbackStatus = useCallback((id: number, data: FeedbackAdminUpdateInput) => {
        return handleRequest(() => feedbackService.updateFeedbackStatus(id, data));
    }, []);

    const getFeedbackStats = useCallback(() => {
        return handleRequest(() => feedbackService.getFeedbackStats());
    }, []);

    const uploadAttachment = useCallback((file: File) => {
        return handleRequest(() => feedbackService.uploadAttachment(file));
    }, []);

    const updateFeedback = useCallback((id: number, data: FeedbackUpdateInput) => {
        return handleRequest(() => feedbackService.updateFeedback(id, data));
    }, []);

    const deleteFeedback = useCallback((id: number) => {
        return handleRequest(() => feedbackService.deleteFeedback(id));
    }, []);

    return {
        loading,
        error,
        getAllFeedback,
        getFeedbackById,
        createFeedback,
        getAdminFeedback,
        updateFeedbackStatus,
        getFeedbackStats,
        uploadAttachment,
        updateFeedback,
        deleteFeedback
    };
};
