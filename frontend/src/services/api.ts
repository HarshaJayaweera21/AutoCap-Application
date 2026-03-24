import axios from "axios";
import type { Category, Doc } from "../types";

// Helper to read a cookie by name
const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
};

const api = axios.create({
    baseURL: "http://localhost:8080",
});

// Attach JWT token from cookies to every request
api.interceptors.request.use((config) => {
    const token = getCookie("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getCategories = async (): Promise<Category[]> => {
    const { data } = await api.get<Category[]>("/categories");
    return data;
};

export const getDocs = async (): Promise<Doc[]> => {
    const { data } = await api.get<Doc[]>("/docs");
    return data;
};

export const getDocById = async (id: string): Promise<Doc> => {
    const { data } = await api.get<Doc>(`/docs/${id}`);
    return data;
};

// ==================== ADMIN API ====================

// --- Docs ---
export const adminCreateDoc = async (doc: Omit<Doc, 'id' | 'tags'> & { tagIds?: string[] }) => {
    const { data } = await api.post('/admin/docs', doc);
    return data;
};

export const adminUpdateDoc = async (id: string, doc: Omit<Doc, 'id' | 'tags'> & { tagIds?: string[] }) => {
    const { data } = await api.put(`/admin/docs/${id}`, doc);
    return data;
};

export const adminDeleteDoc = async (id: string) => {
    await api.delete(`/admin/docs/${id}`);
};

// --- Categories ---
export const adminCreateCategory = async (category: { name: string; orderIndex?: number }) => {
    const { data } = await api.post('/admin/categories', category);
    return data;
};

export const adminUpdateCategory = async (id: string, category: { name: string; orderIndex?: number }) => {
    const { data } = await api.put(`/admin/categories/${id}`, category);
    return data;
};

export const adminDeleteCategory = async (id: string) => {
    await api.delete(`/admin/categories/${id}`);
};

// --- Tags ---
export const getTags = async () => {
    const { data } = await api.get('/admin/tags');
    return data;
};

export const adminCreateTag = async (tag: { name: string }) => {
    const { data } = await api.post('/admin/tags', tag);
    return data;
};

export const adminDeleteTag = async (id: string) => {
    await api.delete(`/admin/tags/${id}`);
};

// --- Tokenizers ---
export const getTokenizers = async () => {
    const { data } = await api.get('/tokenizers');
    return data;
};

export const searchDocs = async (query: string) => {
    const { data } = await api.get(`/docs/search?q=${encodeURIComponent(query)}`);
    return data;
};

export const adminCreateTokenizer = async (tokenizer: { name: string; modelKey: string; description?: string; orderIndex?: number }) => {
    const { data } = await api.post('/admin/tokenizers', tokenizer);
    return data;
};

export const adminDeleteTokenizer = async (id: string) => {
    await api.delete(`/admin/tokenizers/${id}`);
};
