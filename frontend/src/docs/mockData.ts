export interface Category {
  id: string;
  name: string;
}

export interface Doc {
  id: string;
  categoryId: string;
  title: string;
  content: string;
}

export const categories: Category[] = [
  { id: "1", name: "Introduction" },
  { id: "2", name: "System Architecture" },
  { id: "3", name: "AI Insights" },
];

export const docs: Doc[] = [
  {
    id: "d1",
    categoryId: "1",
    title: "What is AutoCap?",
    content: "AutoCap is a multimodal data engine that generates image captions and evaluates them using CLIP embeddings."
  },
  {
    id: "d2",
    categoryId: "3",
    title: "Word Embeddings",
    content: "Word embeddings represent words in a continuous vector space where semantic similarity corresponds to cosine similarity."
  },
  {
    id: "d3",
    categoryId: "3",
    title: "Attention Maps",
    content: "Attention maps highlight which regions of the image influenced each generated word."
  }
];