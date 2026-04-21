import { useEffect, useState } from 'react';
import { getTokenizers, adminCreateTokenizer, adminDeleteTokenizer } from '../services/api';
import './ManageDocs.css';

interface Tokenizer {
    id: string;
    name: string;
    modelKey: string;
    description: string;
    orderIndex: number;
}

function ManageTokenizers() {
    const [tokenizers, setTokenizers] = useState<Tokenizer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [formName, setFormName] = useState('');
    const [formModelKey, setFormModelKey] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formOrder, setFormOrder] = useState<number>(0);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getTokenizers();
            setTokenizers(data);
            setError('');
        } catch {
            setError('Failed to fetch tokenizers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim() || !formModelKey.trim()) return;
        setSaving(true);
        setError('');
        try {
            await adminCreateTokenizer({
                name: formName.trim(),
                modelKey: formModelKey.trim(),
                description: formDescription.trim(),
                orderIndex: formOrder,
            });
            setFormName('');
            setFormModelKey('');
            setFormDescription('');
            setFormOrder(0);
            fetchData();
        } catch {
            setError('Failed to create tokenizer');
        } finally {
            setSaving(false);
        }
    };

    const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

    const openDeleteModal = (id: string, name: string) => setDeleteTarget({id, name});
    const closeDeleteModal = () => setDeleteTarget(null);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminDeleteTokenizer(deleteTarget.id);
            setTokenizers(tokenizers.filter(t => t.id !== deleteTarget.id));
            closeDeleteModal();
        } catch {
            setError('Failed to delete tokenizer');
            closeDeleteModal();
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="mdo-page">
            {error && <div style={errorStyle}>{error}</div>}

            {/* Create form */}
            <form onSubmit={handleCreate} style={formStyle}>
                <h3 style={{ margin: 0, color: '#e0e0ff', fontSize: '1rem' }}>Add Tokenizer</h3>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={labelStyle}>Display Name *</label>
                        <input style={inputStyle} value={formName} onChange={e => setFormName(e.target.value)} placeholder="GPT-4o" required />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={labelStyle}>Model Key *</label>
                        <input style={inputStyle} value={formModelKey} onChange={e => setFormModelKey(e.target.value)} placeholder="gpt-4o" required />
                    </div>
                    <div style={{ flex: 2, minWidth: '200px' }}>
                        <label style={labelStyle}>Description</label>
                        <input style={inputStyle} value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="o200k_base — Latest, 200K vocab" />
                    </div>
                    <div style={{ width: '80px' }}>
                        <label style={labelStyle}>Order</label>
                        <input style={inputStyle} type="number" value={formOrder} onChange={e => setFormOrder(parseInt(e.target.value) || 0)} />
                    </div>
                    <button type="submit" disabled={saving} className="mdo-primary-btn">
                        {saving ? '...' : <><span className="material-symbols-outlined">add</span> Add</>}
                    </button>
                </div>
            </form>

            <div className="mdo-header" style={{ justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
                <p className="mdo-subtitle">{tokenizers.length} tokenizer(s)</p>
            </div>

            <div className="mdo-table-container">
                <div className="mdo-table-scroll">
                    <table className="mdo-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Model Key</th>
                                <th>Description</th>
                                <th>Order</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokenizers.map(t => (
                                <tr key={t.id}>
                                    <td className="mdo-cell-title">{t.name}</td>
                                    <td style={{ fontFamily: 'monospace', color: '#a5a0ff' }}>{t.modelKey}</td>
                                    <td className="mdo-cell-cat">{t.description}</td>
                                    <td>{t.orderIndex}</td>
                                    <td>
                                        <div className="mdo-actions">
                                            <button className="mdo-btn-icon danger" onClick={() => openDeleteModal(t.id, t.name)} title="Delete">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tokenizers.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', color: '#8e8fa3', padding: '2rem' }}>
                                        No tokenizers configured. Add one above to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(108,99,255,0.06)', borderRadius: '8px', border: '1px solid rgba(108,99,255,0.12)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    <strong style={{ color: '#a5a0ff' }}>💡 Supported model keys:</strong> gpt-4o, gpt-4, gpt-3.5-turbo, text-davinci-003, text-davinci-002, text-davinci-001, davinci, curie, babbage, ada
                </p>
            </div>

            {deleteTarget && (
                <div className="mdo-modal-overlay">
                    <div className="mdo-modal-backdrop" onClick={closeDeleteModal}></div>
                    <div className="mdo-modal-content mdo-modal-confirm">
                        <div className="mdo-confirm-bar"></div>
                        <div className="mdo-confirm-body">
                            <div className="mdo-confirm-icon-wrap">
                                <span className="material-symbols-outlined">delete_forever</span>
                            </div>
                            <h2 className="mdo-confirm-title">Delete Tokenizer?</h2>
                            <p className="mdo-confirm-desc">
                                Are you sure you want to delete the configuration for "{deleteTarget.name}"?
                            </p>
                            <div className="mdo-confirm-actions">
                                <button className="mdo-btn-confirm" onClick={confirmDelete}>
                                    Yes, delete tokenizer
                                </button>
                                <button className="mdo-btn-confirm-cancel" onClick={closeDeleteModal}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== Styles ====================
const errorStyle: React.CSSProperties = { background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' };
const formStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' };
const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.5rem 0.6rem', color: '#e0e0ff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { background: '#6c63ff', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', overflow: 'hidden' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' };
const deleteBtnStyle: React.CSSProperties = { background: 'rgba(255,80,80,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,80,80,0.2)', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' };

export default ManageTokenizers;
