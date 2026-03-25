import { useState } from "react";
import type { Category, Doc } from "../types";

interface SidebarProps {
  categories: Category[];
  docs: Doc[];
  selectedDocId: string | null;
  onSelectDoc: (docId: string) => void;
}

const Sidebar = ({ categories, docs, selectedDocId, onSelectDoc }: SidebarProps) => {
  const [expandedCats, setExpandedCats] = useState<string[]>(
    categories.map((c) => c.id)
  );

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  return (
    <div className="sidebar">
      <h3 className="sidebar-title">Documentation</h3>
      {categories.map((cat) => {
        const isExpanded = expandedCats.includes(cat.id);
        const catDocs = docs.filter((doc) => doc.categoryId === cat.id);
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
                    className={selectedDocId === doc.id ? "active" : ""}
                    onClick={() => onSelectDoc(doc.id)}
                  >
                    {doc.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;