import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Category, Doc } from "../types";
import { getCategories, getDocs } from "../services/api";

const Sidebar = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [categories, setCategories] = useState<Category[]>([]);
    const [docs, setDocs] = useState<Doc[]>([]);
    const [expandedCats, setExpandedCats] = useState<string[]>([]);

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
                setExpandedCats(sortedCats.map((c) => c.id));
            } catch (err) {
                console.error("Failed to load sidebar data:", err);
            }
        };
        loadData();
    }, []);

    const toggleCategory = (catId: string) => {
        setExpandedCats((prev) =>
            prev.includes(catId) ? prev.filter((cid) => cid !== catId) : [...prev, catId]
        );
    };

    const handleDocClick = (docId: string) => {
        navigate(`/categories/${docId}`);
    };

    return (
        <aside className="sidebar">
            <h3 className="sidebar-title">Documentation</h3>
            {categories.map((cat) => {
                const isExpanded = expandedCats.includes(cat.id);
                const catDocs = docs.filter((doc) => doc.categoryId === cat.id);

                if (catDocs.length === 0) return null;

                return (
                    <div key={cat.id} className="category">
                        <h4 onClick={() => toggleCategory(cat.id)} className="category-header">
                            <span className={`chevron ${isExpanded ? "expanded" : ""}`}>▶</span>
                            {cat.name}
                        </h4>
                        {isExpanded && (
                            <ul>
                                {catDocs.map((doc) => (
                                    <li
                                        key={doc.id}
                                        className={id === doc.id ? "active" : ""}
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
        </aside>
    );
};

export default Sidebar;
