import {
    Feedback,
    FeedbackCreateInput,
    FeedbackAdminUpdateInput,
    FeedbackUpdateInput,
    FeedbackStatsData
} from '../types/feedback';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';

class FeedbackService {
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async getAllFeedback(params?: {
        skip?: number;
        limit?: number;
        type?: string;
        status?: string;
        search?: string;
    }): Promise<Feedback[]> {
        const url = new URL(`${API_BASE_URL}/feedback/`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(url.toString(), {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch feedback list');
        return response.json();
    }

    async getFeedbackById(id: number): Promise<Feedback> {
        const response = await fetch(`${API_BASE_URL}/feedback/${id}`, {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch feedback details');
        return response.json();
    }

    async createFeedback(data: FeedbackCreateInput): Promise<Feedback> {
        const headers: any = this.getHeaders();
        // Since backend requires X-User-Id for POST requests, get it from local storage or default to 2 (valid user) for now.
        const userId = localStorage.getItem('user_id') || '2';
        headers['X-User-Id'] = userId;

        const response = await fetch(`${API_BASE_URL}/feedback/`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to submit feedback');
        return response.json();
    }

    async updateFeedback(id: number, data: FeedbackUpdateInput): Promise<Feedback> {
        const headers: any = this.getHeaders();
        const userId = localStorage.getItem('user_id') || '2';
        headers['X-User-Id'] = userId;

        const response = await fetch(`${API_BASE_URL}/feedback/${id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update feedback');
        return response.json();
    }

    async deleteFeedback(id: number): Promise<void> {
        const headers: any = this.getHeaders();
        const userId = localStorage.getItem('user_id') || '2';
        headers['X-User-Id'] = userId;

        const response = await fetch(`${API_BASE_URL}/feedback/${id}`, {
            method: 'DELETE',
            headers: headers,
        });
        if (!response.ok) throw new Error('Failed to delete feedback');
    }

    // Admin Methods
    async getAdminFeedback(params?: { skip?: number; limit?: number; status?: string }): Promise<Feedback[]> {
        const url = new URL(`${API_BASE_URL}/admin/feedback/`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(url.toString(), {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch admin feedback list');
        return response.json();
    }

    async updateFeedbackStatus(id: number, data: FeedbackAdminUpdateInput): Promise<Feedback> {
        const response = await fetch(`${API_BASE_URL}/admin/feedback/${id}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update feedback status');
        return response.json();
    }

    async getFeedbackStats(): Promise<FeedbackStatsData> {
        const response = await fetch(`${API_BASE_URL}/admin/feedback/stats/dashboard`, {
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch feedback statistics');
        return response.json();
    }

    async uploadAttachment(file: File): Promise<string> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(URL.createObjectURL(file));
            }, 1000);
        });
    }
}

export const feedbackService = new FeedbackService();