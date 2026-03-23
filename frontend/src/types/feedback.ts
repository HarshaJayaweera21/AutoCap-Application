export type FeedbackStatus = 'New' | 'In Review' | 'Resolved' | "Won't Fix";
export type FeedbackType = 'Bug Report' | 'Feature Request' | 'General' | 'Caption Quality';

export interface Feedback {
  id: number;
  user_id: number;
  type: FeedbackType;
  subject: string | null;
  message: string;
  rating: number | null;
  status: FeedbackStatus;
  screenshot_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCreateInput {
  type?: FeedbackType;
  subject?: string;
  message: string;
  rating?: number;
  screenshot_url?: string;
}

export interface FeedbackAdminUpdateInput {
  status?: FeedbackStatus;
}

export interface FeedbackUpdateInput {
  type?: FeedbackType;
  subject?: string;
  message?: string;
  rating?: number;
  screenshot_url?: string;
}

export interface FeedbackStatsData {
  total_count: number;
  average_rating: number;
  status_breakdown: Record<string, number>;
  type_distribution: Record<string, number>;
}