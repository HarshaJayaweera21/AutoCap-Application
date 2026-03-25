import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import { HiOutlineArrowDownTray, HiOutlineMagnifyingGlass, HiOutlineArrowsPointingOut } from 'react-icons/hi2';
import { HiOutlineX } from 'react-icons/hi';
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

const SearchDatasets: React.FC = () => {
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

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setSelectedIds(new Set());
            return;
        }

        setLoading(true);
        setSelectedIds(new Set());
        const token = getCookie('token');
        try {
            const response = await fetch(`http://localhost:8080/api/search/public-captions?query=${encodeURIComponent(searchQuery)}&size=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            // Data is PagedResponse<PublicCaptionSearchDto>
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
        <div className="search-datasets">
            <Header />
            <main className="search-datasets__main">
                <div className="search-datasets__header">
                    <div className="search-datasets__header-text">
                        <h2>Search Public Datasets</h2>
                        <p>Search via captions across all verified public datasets</p>
                    </div>
                </div>
                
                <div className="search-datasets__search-box">
                    <div className="search-datasets__search-input-wrapper">
                        <HiOutlineMagnifyingGlass className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search image captions (e.g. 'classrooms')..." 
                            value={query}
                            onChange={handleSearchChange}
                            className="search-datasets__input"
                        />
                        <button 
                            className="search-datasets__search-btn"
                            onClick={() => performSearch(query)}
                        >
                            Search
                        </button>
                    </div>
                </div>

                <div className="search-datasets__results-container">
                    {loading && <div className="search-datasets__loading">Searching...</div>}
                    {!loading && results.length === 0 && query.trim().length > 0 && (
                        <div className="search-datasets__no-results">No matches found for "{query}"</div>
                    )}
                    {!loading && results.length > 0 && (
                        <table className="search-datasets__table">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>Image</th>
                                    <th>Caption</th>
                                    <th>Similarity Score</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((result) => (
                                    <tr 
                                        key={result.captionId} 
                                        className={selectedIds.has(result.captionId) ? 'selected-row' : ''}
                                    >
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(result.captionId)}
                                                onChange={() => handleSelectRow(result.captionId)}
                                                className="search-datasets__checkbox"
                                            />
                                        </td>
                                        <td>
                                            {result.imageUrl ? (
                                                <div 
                                                    className="search-datasets__img-wrapper search-datasets__img--clickable"
                                                    onClick={() => setPreviewImage(result.imageUrl)}
                                                >
                                                    <img 
                                                        src={result.imageUrl} 
                                                        alt="Dataset item" 
                                                        className="search-datasets__img" 
                                                    />
                                                    <div className="search-datasets__img-overlay">
                                                        <HiOutlineArrowsPointingOut />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="search-datasets__no-img">No Image</div>
                                            )}
                                        </td>
                                        <td className="search-datasets__caption-text">
                                            {result.captionText}
                                        </td>
                                        <td className="search-datasets__score">
                                            {result.similarityScore !== null 
                                                ? result.similarityScore.toFixed(3) 
                                                : 'N/A'
                                            }
                                        </td>
                                        <td>
                                            {result.isFlagged ? (
                                                <span className="search-datasets__flag flagged">Flagged</span>
                                            ) : (
                                                <span className="search-datasets__flag okay">Not Flagged</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {selectedIds.size > 0 && (
                    <div className="search-datasets__floating-export">
                        <button 
                            className="search-datasets__export-btn"
                            onClick={handleExport}
                        >
                            <HiOutlineArrowDownTray className="btn-icon" />
                            Export ({selectedIds.size})
                        </button>
                    </div>
                )}
            </main>

            {previewImage && (
                <div className="search-datasets__modal-overlay" onClick={() => setPreviewImage(null)}>
                    <div className="search-datasets__modal-content" onClick={e => e.stopPropagation()}>
                        <button 
                            className="search-datasets__modal-close" 
                            onClick={() => setPreviewImage(null)}
                            aria-label="Close"
                        >
                            <HiOutlineX />
                        </button>
                        <img src={previewImage} alt="Fullscreen preview" />
                    </div>
                </div>
            )}

            {isExporting && (
                <div className="search-datasets__modal-overlay">
                    <div className="search-datasets__export-modal">
                        <h3>Exporting Dataset</h3>
                        <p>{exportMessage}</p>
                        <div className="search-datasets__progress-bar-container">
                            <div 
                                className={`search-datasets__progress-bar ${exportStatus === 'FAILED' ? 'error' : ''}`}
                                style={{ width: `${exportProgress}%` }}
                            ></div>
                        </div>
                        <div className="search-datasets__progress-text">
                            {exportStatus === 'FAILED' ? 'Export Failed' : `${exportProgress}%`}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchDatasets;
