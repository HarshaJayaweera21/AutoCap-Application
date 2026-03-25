import { useState, useEffect, useCallback } from 'react';
import { encodingForModel } from 'js-tiktoken';
import type { TiktokenModel } from 'js-tiktoken';
import { getTokenizers } from '../services/api';
import './TokenizerPage.css';

// Color palette for tokens — 20 rotating vibrant colors with dark text for contrast
const TOKEN_COLORS = [
    '#F87171', '#FB923C', '#FACC15', '#4ADE80', '#34D399',
    '#22D3EE', '#818CF8', '#C084FC', '#F472B6', '#FDE047',
    '#A3E635', '#2DD4BF', '#A78BFA', '#FCA5A5', '#6EE7B7',
    '#7DD3FC', '#E879F9', '#93C5FD', '#FB7185', '#86EFAC',
];

interface TokenizerOption {
    id: string;
    name: string;
    modelKey: string;
    description: string;
}

// Fallback tokenizers if backend returns empty
const FALLBACK_TOKENIZERS: TokenizerOption[] = [
    { id: 'f1', name: 'GPT-4o', modelKey: 'gpt-4o', description: 'o200k_base — Latest, 200K vocab' },
    { id: 'f2', name: 'GPT-4 / 3.5 Turbo', modelKey: 'gpt-4', description: 'cl100k_base — 100K vocab' },
    { id: 'f3', name: 'GPT-3 (Davinci)', modelKey: 'text-davinci-003', description: 'p50k_base — 50K vocab' },
];

interface TokenInfo {
    text: string;
    id: number;
    colorIndex: number;
}

function TokenizerWidget() {
    const [inputText, setInputText] = useState('Hello world! Tokenizers break text into smaller pieces called tokens.');
    const [tokenizerOptions, setTokenizerOptions] = useState<TokenizerOption[]>(FALLBACK_TOKENIZERS);
    const [selectedModelKey, setSelectedModelKey] = useState<string>('gpt-4o');
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [tokenIds, setTokenIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch tokenizers from API
    useEffect(() => {
        const loadTokenizers = async () => {
            try {
                const data = await getTokenizers();
                if (data && data.length > 0) {
                    setTokenizerOptions(data);
                    setSelectedModelKey(data[0].modelKey);
                }
            } catch {
                // Use fallback tokenizers
            }
        };
        loadTokenizers();
    }, []);

    const tokenize = useCallback(async (text: string, modelKey: string) => {
        if (!text.trim()) {
            setTokens([]);
            setTokenIds([]);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const enc = encodingForModel(modelKey as TiktokenModel);
            const encoded = Array.from(enc.encode(text));
            setTokenIds(encoded);

            const tokenInfos: TokenInfo[] = encoded.map((id, i) => {
                const decoded = enc.decode([id]);
                return {
                    text: decoded,
                    id,
                    colorIndex: i % TOKEN_COLORS.length,
                };
            });

            setTokens(tokenInfos);
        } catch {
            setError('Failed to tokenize. This tokenizer model may not be supported.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            tokenize(inputText, selectedModelKey);
        }, 150);
        return () => clearTimeout(timer);
    }, [inputText, selectedModelKey, tokenize]);

    const selectedOption = tokenizerOptions.find(o => o.modelKey === selectedModelKey);

    return (
        <div className="tokenizer-widget">
            <div className="tokenizer-layout">
                {/* Left — Input */}
                <div className="tokenizer-input-panel">
                    <div className="panel-header">
                        <h3>Input Text</h3>
                        <span className="char-count">{inputText.length} chars</span>
                    </div>
                    <textarea
                        className="tokenizer-textarea"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Type or paste text here..."
                        spellCheck={false}
                    />
                </div>

                {/* Right — Output */}
                <div className="tokenizer-output-panel">
                    <div className="tokenizer-controls">
                        <div className="tokenizer-selector">
                            <label>Tokenizer</label>
                            <select
                                value={selectedModelKey}
                                onChange={e => setSelectedModelKey(e.target.value)}
                            >
                                {tokenizerOptions.map(opt => (
                                    <option key={opt.id || opt.modelKey} value={opt.modelKey}>
                                        {opt.name}
                                    </option>
                                ))}
                            </select>
                            {selectedOption && (
                                <span className="tokenizer-desc">{selectedOption.description}</span>
                            )}
                        </div>

                        <div className="tokenizer-stats">
                            <div className="stat">
                                <span className="stat-value">{tokenIds.length}</span>
                                <span className="stat-label">Tokens</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{inputText.length}</span>
                                <span className="stat-label">Characters</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">
                                    {inputText.length > 0 ? (inputText.length / Math.max(tokenIds.length, 1)).toFixed(1) : '0'}
                                </span>
                                <span className="stat-label">Chars/Token</span>
                            </div>
                        </div>
                    </div>

                    {error && <div className="tokenizer-error">{error}</div>}

                    <div className="panel-header">
                        <h3>Tokens</h3>
                        {loading && <span className="loading-badge">Tokenizing...</span>}
                    </div>
                    <div className="token-display">
                        {tokens.length === 0 && !loading && (
                            <span className="token-placeholder">Type something to see tokens...</span>
                        )}
                        {tokens.map((token, i) => (
                            <span
                                key={i}
                                className="token-chip"
                                style={{ backgroundColor: TOKEN_COLORS[token.colorIndex] }}
                                title={`Token ID: ${token.id}`}
                            >
                                {token.text.replace(/ /g, '·').replace(/\n/g, '↵\n')}
                            </span>
                        ))}
                    </div>

                    <div className="panel-header" style={{ marginTop: '16px' }}>
                        <h3>Token IDs</h3>
                        <button
                            className="copy-ids-btn"
                            onClick={() => navigator.clipboard.writeText(tokenIds.join(', '))}
                        >
                            Copy
                        </button>
                    </div>
                    <div className="token-ids-display">
                        {tokenIds.length === 0
                            ? <span className="token-placeholder">No tokens</span>
                            : tokenIds.join(', ')
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TokenizerWidget;
