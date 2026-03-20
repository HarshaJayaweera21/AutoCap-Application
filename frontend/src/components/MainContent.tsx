import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Doc } from "../types";
import TokenizerWidget from "../pages/TokenizerPage";

interface MainContentProps {
    doc: Doc | null;
    searchQuery?: string;
}

// Slugs that should embed interactive widgets below the markdown
const WIDGET_SLUGS: Record<string, React.ComponentType> = {
    'tokenization': TokenizerWidget,
};

// Utility: highlight search terms in text nodes
function highlightText(text: string, query: string): React.ReactNode {
    if (!query || query.length < 2) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
        regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
}

// Recursively highlight text in React children
function highlightChildren(children: React.ReactNode, query: string): React.ReactNode {
    if (!query || query.length < 2) return children;
    return React.Children.map(children, child => {
        if (typeof child === 'string') return highlightText(child, query);
        if (React.isValidElement(child) && child.props.children) {
            return React.cloneElement(child, {
                ...child.props,
                children: highlightChildren(child.props.children, query),
            });
        }
        return child;
    });
}

const MainContent = ({ doc, searchQuery = "" }: MainContentProps) => {
    if (!doc) {
        return (
            <main className="main-content">
                <div className="doc-placeholder">
                    <div className="placeholder-icon">📖</div>
                    <h2>AutoCap Documentation</h2>
                    <p>Select a document from the sidebar to get started.</p>
                </div>
            </main>
        );
    }

    // Check if this doc has an embedded widget
    const Widget = WIDGET_SLUGS[doc.slug];

    return (
        <main className="main-content">
            <article className="doc-article">
                <div className="doc-header">
                    <h1>{highlightText(doc.title, searchQuery)}</h1>
                    {doc.endpoint && (
                        <span className="doc-endpoint">
                            <code>{doc.endpoint}</code>
                        </span>
                    )}
                    {doc.tags && doc.tags.length > 0 && (
                        <div className="doc-tags">
                            {doc.tags.map((tag, i) => (
                                <span key={i} className="doc-tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="doc-body">
                    <ReactMarkdown
                        components={{
                            code({ className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || "");
                                const codeString = String(children).replace(/\n$/, "");

                                if (match) {
                                    return (
                                        <div className="code-block-wrapper">
                                            <div className="code-block-header">
                                                <span className="code-lang">{match[1]}</span>
                                                <button
                                                    className="code-copy-btn"
                                                    onClick={() => navigator.clipboard.writeText(codeString)}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <SyntaxHighlighter
                                                style={oneDark}
                                                language={match[1]}
                                                PreTag="div"
                                                customStyle={{
                                                    margin: 0,
                                                    borderRadius: '0 0 8px 8px',
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                {codeString}
                                            </SyntaxHighlighter>
                                        </div>
                                    );
                                }

                                return (
                                    <code className="inline-code" {...props}>
                                        {children}
                                    </code>
                                );
                            },
                            // Highlight search terms in text-heavy elements
                            p({ children }) {
                                return <p>{highlightChildren(children, searchQuery)}</p>;
                            },
                            li({ children }) {
                                return <li>{highlightChildren(children, searchQuery)}</li>;
                            },
                            h1({ children }) {
                                return <h1>{highlightChildren(children, searchQuery)}</h1>;
                            },
                            h2({ children }) {
                                return <h2>{highlightChildren(children, searchQuery)}</h2>;
                            },
                            h3({ children }) {
                                return <h3>{highlightChildren(children, searchQuery)}</h3>;
                            },
                            h4({ children }) {
                                return <h4>{highlightChildren(children, searchQuery)}</h4>;
                            },
                            table({ children }) {
                                return (
                                    <div className="table-wrapper">
                                        <table>{children}</table>
                                    </div>
                                );
                            },
                            td({ children }) {
                                return <td>{highlightChildren(children, searchQuery)}</td>;
                            },
                            blockquote({ children }) {
                                return <blockquote className="doc-blockquote">{children}</blockquote>;
                            },
                            a({ href, children }) {
                                return (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="doc-link">
                                        {children}
                                    </a>
                                );
                            },
                        }}
                    >
                        {doc.content}
                    </ReactMarkdown>
                </div>

                {/* Embedded interactive widget */}
                {Widget && (
                    <div className="doc-widget-section">
                        <div className="widget-divider">
                            <span>🧪 Interactive Tool</span>
                        </div>
                        <Widget />
                    </div>
                )}
            </article>
        </main>
    );
};

export default MainContent;
