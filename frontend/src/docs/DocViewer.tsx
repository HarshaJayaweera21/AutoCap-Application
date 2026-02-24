import type { Doc } from "../types";

interface DocViewerProps {
  doc: Doc | null;
}

const DocViewer = ({ doc }: DocViewerProps) => {
  if (!doc) {
    return <div className="doc-viewer">Select a document...</div>;
  }

  return (
    <div className="doc-viewer">
      <h2>{doc.title}</h2>
      <p>{doc.content}</p>
    </div>
  );
};

export default DocViewer;