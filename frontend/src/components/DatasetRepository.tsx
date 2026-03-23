import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import type { Dataset } from '../types/dataset';
import { fetchDatasets, createDataset, deleteDataset } from '../api/datasetApi';
import DatasetDetailsModal from './DatasetDetailsModal';

export default function DatasetRepository() {
  const { userId } = useUser();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Dataset>>({
    name: '',
    description: '',
    filePath: '',
    format: 'CSV',
  });

  useEffect(() => {
    loadDatasets();
  }, [userId]);

  async function loadDatasets() {
    try {
      setLoading(true);
      const data = await fetchDatasets(userId ?? undefined);
      setDatasets(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.filePath) return;
    if (userId == null) return; // Must be logged in
    try {
      const payload: Dataset = {
        ...formData,
        name: formData.name!,
        filePath: formData.filePath!,
        userId,
      } as Dataset;
      await createDataset(payload);
      setFormData({ name: '', description: '', filePath: '', format: 'CSV' });
      setShowForm(false);
      loadDatasets();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create dataset');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this dataset?')) return;
    if (userId == null) return; // Must be logged in
    try {
      await deleteDataset(id, userId);
      loadDatasets();
      if (detailsId === id) setDetailsId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  if (loading) return <div className="dataset-repo">Loading datasets...</div>;
  if (error) return <div className="dataset-repo error">Error: {error}</div>;

  return (
    <div className="dataset-repo">
      <div className="repo-header">
        <h1>Dataset Repository</h1>
        {userId != null && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Dataset'}
          </button>
        )}
      </div>

      {showForm && (
        <form className="dataset-form" onSubmit={handleSubmit}>
          <input
            placeholder="Dataset name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            placeholder="File path *"
            value={formData.filePath}
            onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <select
            value={formData.format}
            onChange={(e) => setFormData({ ...formData, format: e.target.value })}
          >
            <option value="CSV">CSV</option>
            <option value="JSON">JSON</option>
            <option value="Parquet">Parquet</option>
          </select>
          <button type="submit" className="btn-primary">
            Create Dataset
          </button>
        </form>
      )}

      <div className="dataset-list">
        {datasets.length === 0 ? (
          <p>
            {userId != null
              ? 'No datasets for your user. Add one to get started.'
              : 'Log in with a User ID to see your datasets, or add one.'}
          </p>
        ) : (
          datasets.map((ds) => (
            <div key={ds.id} className="dataset-card">
              <div className="card-main">
                <h3>{ds.name}</h3>
                <p className="meta">
                  {ds.format} • {ds.rowCount ?? 0} rows • {ds.columnCount ?? 0} cols
                </p>
                {ds.description && <p className="desc">{ds.description}</p>}
              </div>
              <div className="card-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => ds.id && setDetailsId(ds.id)}
                >
                  View Details
                </button>
                <Link to={`/explorer/${ds.id}`} className="btn-secondary">
                  Explore
                </Link>
                {userId != null && ds.userId != null && ds.userId === userId && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => ds.id && handleDelete(ds.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {detailsId != null && (
        <DatasetDetailsModal
          datasetId={detailsId}
          userId={userId ?? undefined}
          onClose={() => setDetailsId(null)}
          onSaved={loadDatasets}
          onDeleted={() => setDetailsId(null)}
        />
      )}
    </div>
  );
}
