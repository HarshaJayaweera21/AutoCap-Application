import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { Doc } from "../types";
import { getDocById } from "../services/api";
import Sidebar from "../components/Sidebar";
import MainContent from "../components/MainContent";
import "../docs/docs.css";

const DocumentationPage = () => {
    const { id } = useParams<{ id: string }>();
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);

    useEffect(() => {
        if (id) {
            getDocById(id)
                .then(setSelectedDoc)
                .catch((err) => console.error("Failed to load doc:", err));
        } else {
            setSelectedDoc(null);
        }
    }, [id]);

    return (
        <div className="docs-layout">
            <Sidebar />
            <MainContent doc={selectedDoc} />
        </div>
    );
};

export default DocumentationPage;
