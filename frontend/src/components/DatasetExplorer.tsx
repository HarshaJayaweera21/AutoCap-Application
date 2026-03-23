import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import type { ExplorerView } from '../types/dataset';
import { fetchExplorerView } from '../api/datasetApi';

export default function DatasetExplorer() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useUser();
  const [view, setView] = useState<ExplorerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadExplorer(parseInt(id, 10));
    }
  }, [id, userId]);

  async function loadExplorer(datasetId: number) {
    try {
      setLoading(true);
      const data = await fetchExplorerView(datasetId, userId ?? undefined);
      setView(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load explorer');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="dataset-explorer">Loading explorer...</div>;
  if (error || !view) {
    return (
      <div className="dataset-explorer error">
        {error || 'Dataset not found'}
        <Link to="/repository">← Back to Repository</Link>
      </div>
    );
  }

  return (
    <div className="dataset-explorer">
      <div className="explorer-header">
        <Link to="/repository">← Repository</Link>
        <h1>{view.datasetName}</h1>
        <p className="stats">
          {view.totalRows} rows × {view.totalColumns} columns
        </p>
      </div>

      <section className="explorer-section">
        <h2>Statistics</h2>
        <div className="stats-grid">
          {Object.entries(view.statistics).map(([key, val]) => (
            <div key={key} className="stat-card">
              <span className="stat-label">{key}</span>
              <span className="stat-value">{String(val)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="explorer-section">
        <h2>Columns</h2>
        <div className="columns-list">
          {view.columns.map((col) => (
            <div key={col.name} className="column-info">
              <strong>{col.name}</strong> — {col.type}
            </div>
          ))}
        </div>
      </section>

      <section className="explorer-section">
        <h2>Sample Data</h2>
        <div className="sample-table-wrapper">
          <table className="sample-table">
            <thead>
              <tr>
                {view.columns.map((c) => (
                  <th key={c.name}>{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.sampleRows.map((row, i) => (
                <tr key={i}>
                  {view.columns.map((c) => (
                    <td key={c.name}>{String(row[c.name] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
