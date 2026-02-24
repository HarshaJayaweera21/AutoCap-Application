import ReactMarkdown from "react-markdown";
import type { Doc } from "../types";

interface MainContentProps {
    doc: Doc | null;
}

const MainContent = ({ doc }: MainContentProps) => {
    if (!doc) {
        return (
            <main className="main-content">
                Select a document from the sidebar
            </main>
        );
    }

    return (
        <main className="main-content">
            <h2>{doc.title}</h2>
            <ReactMarkdown>{doc.content}</ReactMarkdown>
        </main>
    );
};

export default MainContent;
