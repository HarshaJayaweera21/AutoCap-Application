import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Category, Doc } from "../types";
import { getCategories, getDocs, searchDocs } from "../services/api";

// ── Icon mapping: category name → Material Symbol ──────────────
const CATEGORY_ICONS: { keyword: string; icon: string }[] = [
    { keyword: "getting started", icon: "rocket_launch" },
    { keyword: "getting", icon: "rocket_launch" },
    { keyword: "start", icon: "rocket_launch" },
    { keyword: "introduction", icon: "rocket_launch" },
    { keyword: "model architecture", icon: "account_tree" },
    { keyword: "architecture", icon: "account_tree" },
    { keyword: "pretrained", icon: "account_tree" },
    { keyword: "ai insight", icon: "psychology" },
    { keyword: "insight", icon: "psychology" },
    { keyword: "ai", icon: "psychology" },
    { keyword: "system", icon: "settings" },
    { keyword: "api", icon: "api" },
    { keyword: "guide", icon: "menu_book" },
];

function getCategoryIcon(name: string): string {
    const lower = name.toLowerCase();
    for (const entry of CATEGORY_ICONS) {
        if (lower.includes(entry.keyword)) return entry.icon;
    }
    return "folder";
}

// ── Highlight matched text in search results ────────────────────
function highlight(text: string, query: string): (string | React.ReactElement)[] {
    if (!query || query.length < 2) return [text];
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.split(regex).map((part, i) =>
        regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
}

const Sidebar = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [categories, setCategories] = useState<Category[]>([]);
    const [docs, setDocs] = useState<Doc[]>([]);
    const [expandedCats, setExpandedCats] = useState<string[]>([]);

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Doc[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Load sidebar data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [cats, allDocs] = await Promise.all([
                    getCategories(),
                    getDocs(),
                ]);
                const sortedCats = [...cats].sort((a, b) => a.orderIndex - b.orderIndex);
                const sortedDocs = [...allDocs].sort((a, b) => a.orderIndex - b.orderIndex);
                setCategories(sortedCats);
                setDocs(sortedDocs);
                setExpandedCats(sortedCats.map((c) => c.id)); // all expanded by default
            } catch (err) {
                console.error("Failed to load sidebar data:", err);
            }
        };
        loadData();
    }, []);

    // Toggle category expand/collapse
    const toggleCategory = (catId: string) => {
        setExpandedCats((prev) =>
            prev.includes(catId) ? prev.filter((cid) => cid !== catId) : [...prev, catId]
        );
    };

    // Navigate to a doc
    const handleDocClick = (docId: string) => {
        navigate(`/categories/${docId}`);
        setShowResults(false);
        setSearchQuery("");
    };

    // ── Search ──────────────────────────────────────────────────
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

    useEffect(() => {
        const timer = setTimeout(() => handleSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const getSnippet = (content: string, query: string): string => {
        const lower = content.toLowerCase();
        const idx = lower.indexOf(query.toLowerCase());
        if (idx === -1) return content.substring(0, 100) + "…";
        const start = Math.max(0, idx - 30);
        const end = Math.min(content.length, idx + query.length + 70);
        let snip = content.substring(start, end);
        if (start > 0) snip = "…" + snip;
        if (end < content.length) snip += "…";
        return snip;
    };

    // ── Determine active category (based on selected doc) ───────
    const selectedDoc = docs.find((d) => d.id === id);
    const activeCatId = selectedDoc?.categoryId ?? null;

    return (
        <aside className="docs-sidebar">
            {/* ── Search bar ── */}
            <div className="docs-sidebar-search">
                <div className="docs-sidebar-search-wrapper">
                    <span className="docs-sidebar-search-icon">search</span>
                    <input
                        className="docs-sidebar-search-input"
                        type="text"
                        placeholder="Search docs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        autoComplete="off"
                    />

                    {/* Search results dropdown */}
                    {showResults && (
                        <div className="docs-sidebar-search-results">
                            {isSearching && (
                                <div className="docs-sidebar-searching">Searching…</div>
                            )}
                            {!isSearching && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                                <div className="docs-sidebar-no-results">
                                    No results for "{searchQuery}"
                                </div>
                            )}
                            {!isSearching &&
                                searchResults.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="docs-sidebar-search-result-item"
                                        onMouseDown={() => handleDocClick(doc.id)}
                                    >
                                        <div className="docs-sidebar-search-result-title">
                                            {highlight(doc.title, searchQuery)}
                                        </div>
                                        <div className="docs-sidebar-search-result-snippet">
                                            {getSnippet(doc.content, searchQuery)}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Category nav ── */}
            <nav className="docs-sidebar-nav">
                {categories.map((cat) => {
                    const isExpanded = expandedCats.includes(cat.id);
                    const catDocs = docs.filter((d) => d.categoryId === cat.id);
                    if (catDocs.length === 0) return null;

                    const isActive = cat.id === activeCatId;
                    const icon = getCategoryIcon(cat.name);

                    return (
                        <div key={cat.id}>
                            {/* Category header */}
                            <div
                                className={`docs-cat-header${isActive ? " docs-cat-active" : ""}`}
                                onClick={() => toggleCategory(cat.id)}
                            >
                                <span className="docs-cat-icon">{icon}</span>
                                <span className="docs-cat-label">{cat.name}</span>
                                <span className={`docs-cat-chevron${isExpanded ? " docs-expanded" : ""}`}>
                                    chevron_right
                                </span>
                            </div>

                            {/* Sub-items */}
                            {isExpanded && (
                                <ul className="docs-cat-items">
                                    {catDocs.map((doc) => (
                                        <li
                                            key={doc.id}
                                            className={`docs-cat-item${id === doc.id ? " docs-item-active" : ""}`}
                                            onClick={() => handleDocClick(doc.id)}
                                        >
                                            {doc.title}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
