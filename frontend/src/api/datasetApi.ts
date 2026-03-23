import type { Dataset, ExplorerView } from '../types/dataset';

const API_BASE = '/api/datasets';

function withUserId(url: string, userId?: number): string {
  if (userId != null) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}userId=${userId}`;
  }
  return url;
}

export async function fetchDatasets(userId?: number): Promise<Dataset[]> {
  const url = withUserId(API_BASE, userId);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch datasets');
  return res.json();
}

export async function fetchDataset(id: number, userId?: number): Promise<Dataset> {
  const url = withUserId(`${API_BASE}/${id}`, userId);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Dataset not found');
  return res.json();
}

export async function fetchExplorerView(id: number, userId?: number): Promise<ExplorerView> {
  const url = withUserId(`${API_BASE}/${id}/explore`, userId);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load explorer view');
  return res.json();
}

export async function createDataset(dataset: Dataset): Promise<Dataset> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataset),
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('You must be logged in to create a dataset');
    throw new Error('Failed to create dataset');
  }
  return res.json();
}

export async function updateDataset(id: number, dataset: Dataset, userId?: number): Promise<Dataset> {
  const url = withUserId(`${API_BASE}/${id}`, userId);
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataset),
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('You can only edit your own datasets');
    throw new Error('Failed to update dataset');
  }
  return res.json();
}

export async function deleteDataset(id: number, userId?: number): Promise<void> {
  const url = withUserId(`${API_BASE}/${id}`, userId);
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    if (res.status === 403) throw new Error('You can only delete your own datasets');
    throw new Error('Failed to delete dataset');
  }
}
