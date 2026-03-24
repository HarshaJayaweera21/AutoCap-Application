import { useState } from "react";
import Sidebar from "./Sidebar";
import DocViewer from "./DocViewer";
import "./docs.css";

const DocsLayout = () => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  return (
    <div className="docs-container">
      <Sidebar onSelectDoc={setSelectedDocId} />
      <DocViewer selectedDocId={selectedDocId} />
    </div>
  );
};

export default DocsLayout;