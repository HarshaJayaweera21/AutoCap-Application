import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Doc } from "../types";
import { getDocById, searchDocs } from "../services/api";
import Sidebar from "../components/Sidebar";
import MainContent from "../components/MainContent";
import ThemeToggle from "../components/ThemeToggle";
import "../docs/docs.css";

const DocumentationPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Doc[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [activeSearchQuery, setActiveSearchQuery] = useState(""); // query passed to MainContent for highlighting

    useEffect(() => {
        if (id) {
            getDocById(id)
                .then(setSelectedDoc)
                .catch((err) => console.error("Failed to load doc:", err));
        } else {
            setSelectedDoc(null);
        }
    }, [id]);

    const handleSearch = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }
        setIsSearching(true);
        try {
            const results = await searchDocs(query.trim());
            setSearchResults(results);
            setShowResults(true);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleResultClick = (doc: Doc) => {
        setActiveSearchQuery(searchQuery);
        setShowResults(false);
        navigate(`/categories/${doc.id}`);
    };

    const getSnippet = (content: string, query: string): string => {
        const lower = content.toLowerCase();
        const idx = lower.indexOf(query.toLowerCase());
        if (idx === -1) return content.substring(0, 120) + "...";
        const start = Math.max(0, idx - 40);
        const end = Math.min(content.length, idx + query.length + 80);
        let snippet = content.substring(start, end);
        if (start > 0) snippet = "..." + snippet;
        if (end < content.length) snippet += "...";
        return snippet;
    };

    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? <mark key={i}>{part}</mark> : part
        );
    };

    return (
        <div className="docs-layout">
            {/* Top search bar */}
            <div className="docs-topbar">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        className="docs-search-input"
                        type="text"
                        placeholder="Search documentation..."
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value);
                            setActiveSearchQuery("");
                        }}
                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    />

                    {showResults && (
                        <div className="search-results-dropdown">
                            {isSearching && (
                                <div className="search-loading">Searching...</div>
                            )}
                            {!isSearching && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                                <div className="search-no-results">No documents found for "{searchQuery}"</div>
                            )}
                            {!isSearching && searchResults.map(doc => (
                                <div
                                    key={doc.id}
                                    className="search-result-item"
                                    onMouseDown={() => handleResultClick(doc)}
                                >
                                    <div className="search-result-title">
                                        {highlightText(doc.title, searchQuery)}
                                    </div>
                                    <div className="search-result-snippet">
                                        {highlightText(getSnippet(doc.content, searchQuery), searchQuery)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <ThemeToggle />
            </div>

            {/* Body: sidebar + content */}
            <div className="docs-body">
                <Sidebar />
                <MainContent doc={selectedDoc} searchQuery={activeSearchQuery} />
            </div>
        </div>
    );
};

export default DocumentationPage;
