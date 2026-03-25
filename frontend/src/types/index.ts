export interface Category {
    id: string;
    name: string;
    orderIndex: number;
}

export interface Doc {
    id: string;
    title: string;
    slug: string;
    content: string;
    endpoint: string | null;
    orderIndex: number;
    categoryId: string;
    tags: string[];
}
