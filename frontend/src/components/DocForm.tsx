import { useState, useEffect } from 'react';
import { getCategories, getTags, adminCreateDoc, adminUpdateDoc } from '../services/api';
import type { Doc, Category } from '../types';

interface Tag {
    id: string;
    name: string;
}

interface DocFormProps {
    doc?: Doc;                    // if provided → edit mode
    existingDocs?: Doc[];          // all docs for duplicate order check
    onSaved: () => void;         // callback after successful save
    onCancel: () => void;        // callback to close form
}

function DocForm({ doc, existingDocs = [], onSaved, onCancel }: DocFormProps) {
    const isEdit = !!doc;

    const [title, setTitle] = useState(doc?.title || '');
    const [slug, setSlug] = useState(doc?.slug || '');
    const [content, setContent] = useState(doc?.content || '');
    const [endpoint, setEndpoint] = useState(doc?.endpoint || '');
    const [orderIndex, setOrderIndex] = useState<number>(doc?.orderIndex ?? 0);
    const [categoryId, setCategoryId] = useState(doc?.categoryId || '');
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [cats, allTags] = await Promise.all([getCategories(), getTags()]);
                setCategories(cats);
                setTags(allTags);

                // Pre-select tags for edit mode (match by name since doc.tags is string[])
                if (doc && doc.tags) {
                    const matchedIds = allTags
                        .filter((t: Tag) => doc.tags.includes(t.name))
                        .map((t: Tag) => t.id);
                    setSelectedTagIds(matchedIds);
                }
            } catch {
                setError('Failed to load categories/tags');
            }
        };
        load();
    }, [doc]);

    const toggleTag = (tagId: string) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate title length
        if (title.trim().length === 0) {
            setError('Title is required.');
            return;
        }
        if (title.length > 100) {
            setError('Title cannot exceed 100 characters.');
            return;
        }

        // Validate slug length
        if (slug.trim().length === 0) {
            setError('Slug is required.');
            return;
        }
        if (slug.length > 100) {
            setError('Slug cannot exceed 100 characters.');
            return;
        }

        // Validate endpoint length (optional but if provided, max 100)
        if (endpoint.length > 100) {
            setError('Endpoint cannot exceed 100 characters.');
            return;
        }

        // Validate order range (0-99)
        if (orderIndex < 0 || orderIndex >= 100) {
            setError('Order must be between 0 and 99.');
            return;
        }

        // Check for duplicate order index within same category
        if (categoryId) {
            const duplicateOrder = existingDocs.find(
                d => d.categoryId === categoryId && d.orderIndex === orderIndex && (!doc || d.id !== doc.id)
            );
            if (duplicateOrder) {
                setError(`Order ${orderIndex} is already used by "${duplicateOrder.title}" in this category. Please choose a different order.`);
                return;
            }
        }

        setSaving(true);

        const payload = {
            title,
            slug,
            content,
            endpoint: endpoint || null,
            orderIndex,
            categoryId,
            tagIds: selectedTagIds,
        };

        try {
            if (isEdit && doc) {
                await adminUpdateDoc(doc.id, payload);
            } else {
                await adminCreateDoc(payload);
            }
            onSaved();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const resp = (err as { response: { data?: { message?: string }; status?: number } }).response;
                if (resp?.data?.message) {
                    setError(resp.data.message);
                } else if (resp?.status === 400) {
                    setError('Validation error — check your inputs');
                } else {
                    setError('Failed to save document');
                }
            } else {
                setError('Failed to save document');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#e0e0ff' }}>
                        {isEdit ? 'Edit Document' : 'Create Document'}
                    </h2>
                    <button onClick={onCancel} style={closeBtnStyle}>✕</button>
                </div>

                {error && <div style={errorStyle}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={fieldRow}>
                        <label style={labelStyle}>Title * <span style={charCountStyle}>({title.length}/100)</span></label>
                        <input
                            style={{
                                ...inputStyle,
                                ...(title.length > 100 ? { borderColor: '#ff6b6b' } : {}),
                            }}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Document title"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div style={fieldRow}>
                        <label style={labelStyle}>Slug * <span style={charCountStyle}>({slug.length}/100)</span></label>
                        <input
                            style={{
                                ...inputStyle,
                                ...(slug.length > 100 ? { borderColor: '#ff6b6b' } : {}),
                            }}
                            value={slug}
                            onChange={e => setSlug(e.target.value)}
                            placeholder="document-slug"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div style={fieldRow}>
                        <label style={labelStyle}>Content *</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Markdown content..."
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ ...fieldRow, flex: 1 }}>
                            <label style={labelStyle}>Endpoint <span style={charCountStyle}>({endpoint.length}/100)</span></label>
                            <input
                                style={{
                                    ...inputStyle,
                                    ...(endpoint.length > 100 ? { borderColor: '#ff6b6b' } : {}),
                                }}
                                value={endpoint}
                                onChange={e => setEndpoint(e.target.value)}
                                placeholder="/api/example"
                                maxLength={100}
                            />
                        </div>
                        <div style={{ ...fieldRow, width: '100px' }}>
                            <label style={labelStyle}>Order *</label>
                            <input
                                style={{
                                    ...inputStyle,
                                    ...(orderIndex < 0 || orderIndex >= 100 ? { borderColor: '#ff6b6b' } : {}),
                                }}
                                type="number"
                                min={0}
                                max={99}
                                value={orderIndex}
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    setOrderIndex(isNaN(val) ? 0 : val);
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div style={fieldRow}>
                        <label style={labelStyle}>Category *</label>
                        <select
                            style={selectStyle}
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            required
                        >
                            <option value="" style={{ background: '#1e1e3a', color: '#e0e0ff' }}>Select category...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id} style={{ background: '#1e1e3a', color: '#e0e0ff' }}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={fieldRow}>
                        <label style={labelStyle}>Tags</label>
                        <div style={tagContainerStyle}>
                            {tags.length === 0 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No tags available</span>}
                            {tags.map(tag => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.id)}
                                    style={selectedTagIds.includes(tag.id) ? tagSelectedStyle : tagStyle}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="button" onClick={onCancel} style={cancelBtnStyle}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} style={submitBtnStyle}>
                            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ==================== Styles ====================

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
    background: '#1e1e3a',
    borderRadius: '12px',
    padding: '1.5rem',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '1px solid rgba(255,255,255,0.08)',
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
};

const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '1.2rem',
    cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
    background: 'rgba(255,80,80,0.1)',
    border: '1px solid rgba(255,80,80,0.3)',
    color: '#ff6b6b',
    padding: '0.6rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginBottom: '0.75rem',
};

const fieldRow: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '0.6rem 0.75rem',
    color: '#e0e0ff',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    color: '#e0e0ff',
};

const charCountStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'none',
    letterSpacing: 'normal',
};

const tagContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    padding: '0.5rem',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.08)',
    minHeight: '36px',
};

const tagStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.6)',
    padding: '0.25rem 0.6rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    cursor: 'pointer',
};

const tagSelectedStyle: React.CSSProperties = {
    ...tagStyle,
    background: 'rgba(108,99,255,0.2)',
    border: '1px solid rgba(108,99,255,0.4)',
    color: '#a5a0ff',
};

const cancelBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.7)',
    padding: '0.5rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
};

const submitBtnStyle: React.CSSProperties = {
    background: '#6c63ff',
    border: 'none',
    color: '#fff',
    padding: '0.5rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
};

export default DocForm;
