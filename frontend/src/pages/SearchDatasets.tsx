import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api/axiosInstance';
import './SearchDatasets.css';

/* ---------- cookie helpers ---------- */
const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
};

interface SearchResult {
    captionId: number;
    imageId: number;
    imageUrl: string;
    captionText: string;
    similarityScore: number;
    isFlagged: boolean;
}

export const SearchDatasets: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    
    // Export state
    const [exportJobId, setExportJobId] = useState<string | null>(null);
    const [exportStatus, setExportStatus] = useState<string>('');
    const [exportProgress, setExportProgress] = useState<number>(0);
    const [exportMessage, setExportMessage] = useState<string>('');
    const [isExporting, setIsExporting] = useState<boolean>(false);
    
    // Typing debounce reference
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial query check from Landing Page override
    useEffect(() => {
        const urlQuery = searchParams.get('query');
        if (urlQuery && urlQuery.trim() !== '') {
            setQuery(urlQuery);
            performSearch(urlQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setSelectedIds(new Set());
            return;
        }

        setLoading(true);
        setSelectedIds(new Set());
        try {
            const { data } = await api.get('/api/search/public-captions', {
                params: {
                    query: searchQuery,
                    size: 20
                }
            });
            setResults(data.content || []);
        } catch (error) {
            console.error('Error fetching search results:', error);
            // Optionally set error state here
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 500);
    };

    const handleSelectRow = (captionId: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(captionId)) {
                next.delete(captionId);
            } else {
                next.add(captionId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === results.length && results.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(results.map(r => r.captionId)));
        }
    };

    const handleExport = async () => {
        if (selectedIds.size === 0) return;
        
        setIsExporting(true);
        setExportStatus('STARTING');
        setExportProgress(0);
        setExportMessage('Initializing export job...');
        
        try {
            const token = getCookie('token');
            const response = await fetch('http://localhost:8080/api/search/export/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ captionIds: Array.from(selectedIds) })
            });
            
            if (!response.ok) throw new Error('Failed to start export');
            
            const data = await response.json();
            setExportJobId(data.jobId);
        } catch (error) {
            console.error('Export error:', error);
            setExportStatus('FAILED');
            setExportMessage('Failed to start export.');
            setTimeout(() => setIsExporting(false), 3000);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        
        if (exportJobId && isExporting) {
            const token = getCookie('token');
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`http://localhost:8080/api/search/export/status/${exportJobId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setExportStatus(data.status);
                        setExportProgress(data.progress);
                        setExportMessage(data.message);
                        
                        if (data.status === 'COMPLETED' && data.downloadReady) {
                            clearInterval(interval);
                            
                            // Download via fetch to maintain Auth headers and show progress
                            setExportMessage("Downloading archive to your device...");
                            setExportStatus('DOWNLOADING');
                            
                            const dlRes = await fetch(`http://localhost:8080/api/search/export/download/${exportJobId}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            
                            if (dlRes.ok) {
                                const contentLength = dlRes.headers.get('content-length');
                                const total = contentLength ? parseInt(contentLength, 10) : 0;
                                
                                let received = 0;
                                const chunks: BlobPart[] = [];
                                const reader = dlRes.body?.getReader();
                                
                                if (reader) {
                                    while (true) {
                                        const { done, value } = await reader.read();
                                        if (done) break;
                                        if (value) {
                                            chunks.push(value);
                                            received += value.length;
                                            if (total > 0) {
                                                const percent = 90 + Math.round((received / total) * 10);
                                                setExportProgress(percent > 100 ? 100 : percent);
                                            }
                                        }
                                    }
                                }
                                
                                setExportProgress(100);
                                setExportMessage("Download complete!");
                                
                                const blob = new Blob(chunks, { type: 'application/zip' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'dataset_export.zip';
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                            } else {
                                setExportStatus('FAILED');
                                setExportMessage('Failed to download archive.');
                            }
                            
                            setTimeout(() => {
                                setIsExporting(false);
                                setExportJobId(null);
                            }, 2000); // keep modal briefly before closing
                        } else if (data.status === 'FAILED') {
                            clearInterval(interval);
                            setTimeout(() => setIsExporting(false), 3000);
                        }
                    }
                } catch (error) {
                    console.error('Error polling status:', error);
                }
            }, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [exportJobId, isExporting]);

    return (
        <div className="mds-page">
            <Header />
            <main className="mds-container">
                <div className="mds-header" style={{ alignItems: 'center', textAlign: 'center' }}>
                    <h2 className="mds-title">Search Results</h2>
                    <p className="mds-subtitle">Explore unified public datasets matching your prompt mapping</p>
                </div>
                
                <div className="mds-top-search">
                    <div className="mds-top-search-input-wrap">
                        <span className="material-symbols-outlined">search</span>
                        <input 
                            type="text" 
                            placeholder="Modify search criteria (e.g. 'classrooms')..." 
                            value={query}
                            onChange={handleSearchChange}
                            className="mds-top-search-input"
                        />
                    </div>
                    <button 
                        className="mds-top-search-btn"
                        onClick={() => performSearch(query)}
                    >
                        Search
                    </button>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {selectedIds.size > 0 && (
                            <span style={{ fontSize: '0.875rem', color: 'var(--mds-outline)' }}>
                                {selectedIds.size} selected
                            </span>
                        )}
                        <button 
                            className="mds-top-search-btn"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                opacity: selectedIds.size === 0 || isExporting ? 0.5 : 1,
                                cursor: selectedIds.size === 0 || isExporting ? 'not-allowed' : 'pointer'
                            }}
                            onClick={handleExport}
                            disabled={selectedIds.size === 0 || isExporting}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>download</span>
                            Export Selection
                        </button>
                    </div>
                </div>

                <div className="mds-table-wrapper">
                    {loading && <div className="mds-empty">Querying public index...</div>}
                    {!loading && results.length === 0 && query.trim().length > 0 && (
                        <div className="mds-empty">No matches found for "{query}" across public datasets.</div>
                    )}
                    {!loading && results.length === 0 && query.trim().length === 0 && (
                        <div className="mds-empty">Please input a search query above.</div>
                    )}
                    
                    {!loading && results.length > 0 && (
                        <div className="mds-table-scroll">
                            <table className="mds-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <input 
                                                type="checkbox" 
                                                className="mds-checkbox"
                                                checked={selectedIds.size === results.length && results.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>Image</th>
                                        <th>Caption Body</th>
                                        <th style={{ width: '120px', textAlign: 'center' }}>Score</th>
                                        <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((result) => {
                                        const isSelected = selectedIds.has(result.captionId);
                                        return (
                                            <tr 
                                                key={result.captionId} 
                                                className={isSelected ? 'selected' : ''}
                                            >
                                                <td>
                                                    <input 
                                                        type="checkbox" 
                                                        className="mds-checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(result.captionId)}
                                                    />
                                                </td>
                                                <td>
                                                    {result.imageUrl ? (
                                                        <div 
                                                            className="mds-img-wrapper"
                                                            onClick={() => setPreviewImage(result.imageUrl as string)}
                                                        >
                                                            <img 
                                                                src={result.imageUrl} 
                                                                alt="Dataset item mapping" 
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" fill="%2336333c"><rect width="120" height="80"/></svg>';
                                                                }}
                                                            />
                                                            <div className="mds-img-overlay">
                                                                <span className="material-symbols-outlined">zoom_out_map</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mds-no-img">No Image</div>
                                                    )}
                                                </td>
                                                <td>
                                                    <p className="mds-caption-text">{result.captionText}</p>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {result.similarityScore !== null ? (
                                                        <span className="mds-score">{result.similarityScore.toFixed(3)}</span>
                                                    ) : (
                                                        <span className="mds-score" style={{ color: 'var(--mds-outline)' }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {result.isFlagged ? (
                                                        <span className="mds-badge-flagged">Flagged</span>
                                                    ) : (
                                                        <span className="mds-badge-okay">Verified</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </main>

            {/* Sub-image popup preview overlay */}
            {previewImage && (
                <div className="mds-modal-overlay" onClick={() => setPreviewImage(null)} style={{ zIndex: 3000 }}>
                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button 
                            className="mds-modal-close" 
                            style={{ position: 'absolute', top: '-2.5rem', right: '0', color: '#fff', fontSize: '1.5rem' }}
                            onClick={() => setPreviewImage(null)}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <img src={previewImage} alt="Fullscreen image rendering" className="mds-preview-img" />
                    </div>
                </div>
            )}

            {/* ZIP Archiving Process Status Overlay */}
            {isExporting && (
                <div className="mds-modal-overlay">
                    <div className="mds-modal-backdrop"></div>
                    <div className="mds-modal-export">
                        <div>
                            <h3>Extracting Records</h3>
                            <p>{exportMessage}</p>
                        </div>
                        <div className="mds-progress-bar-container">
                            <div 
                                className={`mds-progress-bar ${exportStatus === 'FAILED' ? 'error' : ''}`}
                                style={{ width: `${Math.max(5, exportProgress)}%` }} /* Minimum 5% to always show visual */
                            ></div>
                        </div>
                        <div className="mds-progress-text">
                            {exportStatus === 'FAILED' ? 'Export Corrupted' : `${exportProgress}% Completed`}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchDatasets;
