import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Doc } from "../types";
import TokenizerWidget from "../pages/TokenizerPage";
import { getDocs } from "../services/api";

interface MainContentProps {
    doc: Doc | null;
    searchQuery?: string;
}

// Slugs that should embed interactive widgets below the markdown
const WIDGET_SLUGS: Record<string, React.ComponentType> = {
    tokenization: TokenizerWidget,
};

// Quick Access card definitions — matched against live docs by title pattern
const QUICK_ACCESS_ITEMS = [
    {
        pattern: /introduction|what is autocap/i,
        title: "Introduction",
        desc: "Core concepts and API overview.",
        icon: "menu_book",
    },
    {
        pattern: /pretrained|pre-trained/i,
        title: "Pretrained Networks",
        desc: "Explore available vision and language models.",
        icon: "hub",
    },
    {
        pattern: /tokeniz/i,
        title: "Tokenization",
        desc: "Understanding text chunking and BPE.",
        icon: "sort_by_alpha",
    },
    {
        pattern: /clip/i,
        title: "CLIP Similarity",
        desc: "Evaluating image-text alignment scores.",
        icon: "compare",
    },
];

// Utility: highlight search terms in text nodes
function highlightText(text: string, query: string): React.ReactNode {
    if (!query || query.length < 2) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
        regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
}

// Recursively highlight text in React children
function highlightChildren(children: React.ReactNode, query: string): React.ReactNode {
    if (!query || query.length < 2) return children;
    return React.Children.map(children, (child) => {
        if (typeof child === "string") return highlightText(child, query);
        if (React.isValidElement(child)) {
            const p = child.props as Record<string, unknown>;
            if (p.children) {
                return React.cloneElement(child, {
                    ...p,
                    children: highlightChildren(p.children as React.ReactNode, query),
                } as React.HTMLAttributes<HTMLElement>);
            }
        }
        return child;
    });
}

// ── Landing page (no doc selected) ────────────────────────────
const DocsLanding = () => {
    const navigate = useNavigate();
    const [allDocs, setAllDocs] = useState<Doc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDocs()
            .then(setAllDocs)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Match quick access items to real docs
    const resolvedCards = QUICK_ACCESS_ITEMS.map((item) => {
        const matched = allDocs.find((d) => item.pattern.test(d.title));
        return { ...item, docId: matched?.id ?? null };
    });

    const handleCardClick = (docId: string | null) => {
        if (docId) navigate(`/categories/${docId}`);
    };

    return (
        <div className="docs-landing">
            <div className="docs-landing-inner">
                {/* Heading */}
                <h1 className="docs-landing-heading">AutoCap Documentation</h1>
                <p className="docs-landing-subtitle">
                    Select a document from the sidebar to get started, or explore our
                    quick links below to dive straight into the engine.
                </p>

                {/* Quick Access */}
                <p className="docs-quick-label">Quick Access</p>
                <div className="docs-quick-list">
                    {loading
                        ? [1, 2, 3, 4].map((n) => (
                              <div key={n} className="docs-quick-skeleton" />
                          ))
                        : resolvedCards.map((card) => (
                              <div
                                  key={card.title}
                                  className="docs-quick-card"
                                  onClick={() => handleCardClick(card.docId)}
                                  style={{ cursor: card.docId ? "pointer" : "default" }}
                              >
                                  <div className="docs-quick-card-left">
                                      <div className="docs-quick-card-icon">
                                          <span>{card.icon}</span>
                                      </div>
                                      <div>
                                          <div className="docs-quick-card-title">{card.title}</div>
                                          <p className="docs-quick-card-desc">{card.desc}</p>
                                      </div>
                                  </div>
                                  <span className="docs-quick-card-arrow">arrow_forward</span>
                              </div>
                          ))}
                </div>
            </div>
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────
const MainContent = ({ doc, searchQuery = "" }: MainContentProps) => {
    if (!doc) {
        return (
            <main className="docs-main">
                <DocsLanding />
            </main>
        );
    }

    // Check if this doc has an embedded widget
    const Widget = WIDGET_SLUGS[doc.slug];

    return (
        <main className="docs-main">
            <div className="docs-main-content">
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
                                    <span key={i} className="doc-tag">
                                        {tag}
                                    </span>
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
                                                        onClick={() =>
                                                            navigator.clipboard.writeText(codeString)
                                                        }
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
                                                        borderRadius: "0 0 8px 8px",
                                                        fontSize: "0.875rem",
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
                                    return (
                                        <blockquote className="doc-blockquote">{children}</blockquote>
                                    );
                                },
                                a({ href, children }) {
                                    return (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="doc-link"
                                        >
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
            </div>
        </main>
    );
};

export default MainContent;
