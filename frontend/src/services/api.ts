import axios from "axios";
import type { Category, Doc } from "../types";

const api = axios.create({
    baseURL: "http://localhost:8080",
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
