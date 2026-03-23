import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Dataset } from '../types/dataset';
import { fetchDataset, updateDataset, deleteDataset } from '../api/datasetApi';
import './DatasetDetailsModal.css';

interface Props {
  datasetId: number | null;
  userId: number | undefined;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export default function DatasetDetailsModal({
  datasetId,
  userId,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Dataset>>({});

  useEffect(() => {
    if (datasetId == null) return;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchDataset(datasetId, userId);
        setDataset(data);
        setFormData(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [datasetId, userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!datasetId || !dataset || !formData.name || !formData.filePath) return;
    try {
      const payload: Dataset = {
        ...dataset,
        ...formData,
        id: datasetId,
        userId: userId ?? dataset.userId,
      };
      await updateDataset(datasetId, payload, userId);
      setDataset(payload);
      setEditing(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  }

  async function handleDelete() {
    if (!datasetId || !confirm('Delete this dataset? This cannot be undone.')) return;
    try {
      await deleteDataset(datasetId, userId);
      onDeleted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  if (datasetId == null) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editing ? 'Edit Dataset' : 'View Details'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {loading && <p className="modal-loading">Loading...</p>}
        {error && <p className="modal-error">{error}</p>}

        {!loading && dataset && (
          <>
            {editing ? (
              <form className="dataset-details-form" onSubmit={handleSave}>
                <label>Name *</label>
                <input
                  value={formData.name ?? ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <label>File path *</label>
                <input
                  value={formData.filePath ?? ''}
                  onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                  required
                />
                <label>Description</label>
                <input
                  value={formData.description ?? ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <label>Format</label>
                <select
                  value={formData.format ?? 'CSV'}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                >
                  <option value="CSV">CSV</option>
                  <option value="JSON">JSON</option>
                  <option value="Parquet">Parquet</option>
                </select>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">Save</button>
                  <button type="button" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="dataset-details-view">
                <dl>
                  <dt>ID</dt>
                  <dd>{dataset.id}</dd>
                  <dt>User ID</dt>
                  <dd>{dataset.userId}</dd>
                  <dt>Name</dt>
                  <dd>{dataset.name}</dd>
                  <dt>Description</dt>
                  <dd>{dataset.description || '—'}</dd>
                  <dt>File path</dt>
                  <dd>{dataset.filePath}</dd>
                  <dt>Format</dt>
                  <dd>{dataset.format ?? '—'}</dd>
                  <dt>Rows</dt>
                  <dd>{dataset.rowCount ?? '—'}</dd>
                  <dt>Columns</dt>
                  <dd>{dataset.columnCount ?? '—'}</dd>
                  <dt>Created</dt>
                  <dd>{dataset.createdAt ?? '—'}</dd>
                  <dt>Updated</dt>
                  <dd>{dataset.updatedAt ?? '—'}</dd>
                </dl>
                <div className="modal-actions">
                  {userId != null && dataset.userId != null && Number(dataset.userId) === Number(userId) && (
                    <>
                      <button type="button" className="btn-primary" onClick={() => setEditing(true)}>
                        Edit
                      </button>
                      <button type="button" className="btn-danger" onClick={handleDelete}>
                        Delete
                      </button>
                    </>
                  )}
                  <Link to={`/explorer/${dataset.id}`} className="btn-secondary">
                    Explore
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
