import { useEffect, useState } from 'react';
import Header from '../components/Header';
import {
    HiOutlineDocumentText,
    HiOutlineShieldCheck,
    HiOutlineExclamationTriangle,
    HiOutlineCircleStack,
} from 'react-icons/hi2';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';
import './AdminDashboard.css';

/* ========== Types ========== */

interface AdminStats {
    adminFirstName: string;
    adminLastName: string;
}

interface DailyCaptionCount {
    date: string;
    count: number;
}

interface SimilarityBucket {
    range: string;
    count: number;
}

interface DatasetIntelligence {
    totalCaptions: number;
    validatedCaptions: number;
    rejectedCaptions: number;
    totalDatasets: number;
    totalCaptionsChange: number | null;
    validatedCaptionsChange: number | null;
    rejectedCaptionsChange: number | null;
    totalDatasetsChange: number | null;
    captionsPerDay: DailyCaptionCount[];
    validationRate: number;
    avgSimilarity: number | null;
    maxSimilarity: number | null;
    minSimilarity: number | null;
    similarityDistribution: SimilarityBucket[];
}

/* ========== Helpers ========== */

const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
};

const formatNumber = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
};

/* ========== Sub-components ========== */

interface ChangeIndicatorProps {
    change: number | null;
}

function ChangeIndicator({ change }: ChangeIndicatorProps) {
    if (change === null) {
        return <span className="change-badge change-badge--new">New</span>;
    }
    if (change === 0) {
        return <span className="change-badge change-badge--neutral">0% from last week</span>;
    }
    const isUp = change > 0;
    return (
        <span className={`change-badge ${isUp ? 'change-badge--up' : 'change-badge--down'}`}>
            {isUp ? '↑' : '↓'} {Math.abs(change)}% from last week
        </span>
    );
}

/* ========== DONUT COLORS ========== */
const DONUT_COLORS = ['#10b981', '#ef4444']; // green=validated, red=rejected

/* ========== Main Component ========== */

function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [intel, setIntel] = useState<DatasetIntelligence | null>(null);
    const [loading, setLoading] = useState(true);
    const [intelLoading, setIntelLoading] = useState(true);

    useEffect(() => {
        const token = getCookie('token');
        let cancelled = false;

        if (!token) {
            setLoading(false);
            setIntelLoading(false);
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const fetchAdminName = async () => {
            try {
                const res = await fetch('http://localhost:8080/api/admin/stats', { headers });
                if (res.ok && !cancelled) setStats(await res.json());
            } catch {
                /* ignore */
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        const fetchIntel = async () => {
            try {
                const res = await fetch('http://localhost:8080/api/admin/dataset-intelligence', { headers });
                if (res.ok && !cancelled) setIntel(await res.json());
            } catch {
                /* ignore */
            } finally {
                if (!cancelled) setIntelLoading(false);
            }
        };

        fetchAdminName();
        fetchIntel();

        return () => { cancelled = true; };
    }, []);

    /* Donut data */
    const donutData = intel
        ? [
            { name: 'Validated', value: intel.validatedCaptions },
            { name: 'Rejected', value: intel.rejectedCaptions },
        ]
        : [];

    return (
        <div className="admin-container">
            <Header />

            {/* Welcome Banner */}
            <div className="welcome-banner">
                <h1 className="welcome-banner__title">
                    Welcome Admin !{' '}
                    {loading
                        ? '...'
                        : stats
                            ? `${stats.adminFirstName} ${stats.adminLastName}`
                            : ''}
                </h1>
            </div>



            {/* ===== Dataset Intelligence Panel ===== */}
            <div className="intel-section">
                <h2 className="intel-section__title">Dataset Intelligence Panel</h2>

                {/* ── ROW 1: Key Metric Cards ── */}
                <div className="intel-cards">
                    {/* Total Captions */}
                    <div className="intel-card intel-card--neutral">
                        <div className="intel-card__icon-wrapper intel-card__icon-wrapper--neutral">
                            <HiOutlineDocumentText className="intel-card__icon" />
                        </div>
                        <div className="intel-card__info">
                            <span className="intel-card__count">
                                {intelLoading ? '—' : formatNumber(intel?.totalCaptions ?? 0)}
                            </span>
                            <span className="intel-card__label">Total Captions</span>
                            {!intelLoading && intel && (
                                <ChangeIndicator change={intel.totalCaptionsChange} />
                            )}
                        </div>
                    </div>

                    {/* Validated Captions */}
                    <div className="intel-card intel-card--green">
                        <div className="intel-card__icon-wrapper intel-card__icon-wrapper--green">
                            <HiOutlineShieldCheck className="intel-card__icon" />
                        </div>
                        <div className="intel-card__info">
                            <span className="intel-card__count">
                                {intelLoading ? '—' : formatNumber(intel?.validatedCaptions ?? 0)}
                            </span>
                            <span className="intel-card__label">Validated Captions</span>
                            {!intelLoading && intel && (
                                <ChangeIndicator change={intel.validatedCaptionsChange} />
                            )}
                        </div>
                    </div>

                    {/* Rejected Captions */}
                    <div className="intel-card intel-card--red">
                        <div className="intel-card__icon-wrapper intel-card__icon-wrapper--red">
                            <HiOutlineExclamationTriangle className="intel-card__icon" />
                        </div>
                        <div className="intel-card__info">
                            <span className="intel-card__count">
                                {intelLoading ? '—' : formatNumber(intel?.rejectedCaptions ?? 0)}
                            </span>
                            <span className="intel-card__label">Rejected Captions</span>
                            {!intelLoading && intel && (
                                <ChangeIndicator change={intel.rejectedCaptionsChange} />
                            )}
                        </div>
                    </div>

                    {/* Total Datasets */}
                    <div className="intel-card intel-card--purple">
                        <div className="intel-card__icon-wrapper intel-card__icon-wrapper--purple">
                            <HiOutlineCircleStack className="intel-card__icon" />
                        </div>
                        <div className="intel-card__info">
                            <span className="intel-card__count">
                                {intelLoading ? '—' : formatNumber(intel?.totalDatasets ?? 0)}
                            </span>
                            <span className="intel-card__label">Total Datasets</span>
                            {!intelLoading && intel && (
                                <ChangeIndicator change={intel.totalDatasetsChange} />
                            )}
                        </div>
                    </div>
                </div>

                {/* ── ROW 2: Validation Performance ── */}
                <div className="intel-row">
                    {/* LEFT — Line Chart */}
                    <div className="intel-panel">
                        <h3 className="intel-panel__title">Captions Generated Per Day</h3>
                        <div className="intel-panel__chart">
                            {intelLoading ? (
                                <div className="intel-panel__loading">Loading chart…</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={intel?.captionsPerDay ?? []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11 }}
                                            tickFormatter={(v: string) => {
                                                const d = new Date(v);
                                                return `${d.getDate()}/${d.getMonth() + 1}`;
                                            }}
                                        />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 10,
                                                border: '1px solid #e5e7eb',
                                                fontSize: 13,
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#6366f1"
                                            strokeWidth={2.5}
                                            dot={{ r: 3, fill: '#6366f1' }}
                                            activeDot={{ r: 5 }}
                                            name="Captions"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — Donut Chart */}
                    <div className="intel-panel intel-panel--compact">
                        <h3 className="intel-panel__title">Validation Rate</h3>
                        <div className="intel-panel__chart intel-panel__chart--donut">
                            {intelLoading ? (
                                <div className="intel-panel__loading">Loading chart…</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={3}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {donutData.map((_entry, idx) => (
                                                <Cell
                                                    key={`cell-${idx}`}
                                                    fill={DONUT_COLORS[idx % DONUT_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 10,
                                                border: '1px solid #e5e7eb',
                                                fontSize: 13,
                                            }}
                                        />
                                        {/* Center label */}
                                        <text
                                            x="50%"
                                            y="46%"
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            className="donut-center-value"
                                        >
                                            {intel?.validationRate ?? 0}%
                                        </text>
                                        <text
                                            x="50%"
                                            y="56%"
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            className="donut-center-label"
                                        >
                                            Validated
                                        </text>
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                            <div className="donut-legend">
                                <span className="donut-legend__item">
                                    <span
                                        className="donut-legend__dot"
                                        style={{ background: '#10b981' }}
                                    />
                                    Validated
                                </span>
                                <span className="donut-legend__item">
                                    <span
                                        className="donut-legend__dot"
                                        style={{ background: '#ef4444' }}
                                    />
                                    Rejected
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── ROW 3: Similarity Quality Insights ── */}
                <div className="intel-row">
                    {/* LEFT — Similarity Stats */}
                    <div className="intel-panel">
                        <h3 className="intel-panel__title">Similarity Statistics</h3>
                        <div className="similarity-stats">
                            <div className="sim-stat sim-stat--primary">
                                <span className="sim-stat__value">
                                    {intelLoading
                                        ? '—'
                                        : intel?.avgSimilarity != null
                                            ? intel.avgSimilarity.toFixed(2)
                                            : 'N/A'}
                                </span>
                                <span className="sim-stat__label">Average Similarity</span>
                            </div>
                            <div className="sim-stat-row">
                                <div className="sim-stat sim-stat--secondary">
                                    <span className="sim-stat__value">
                                        {intelLoading
                                            ? '—'
                                            : intel?.maxSimilarity != null
                                                ? intel.maxSimilarity.toFixed(2)
                                                : 'N/A'}
                                    </span>
                                    <span className="sim-stat__label">Max</span>
                                </div>
                                <div className="sim-stat sim-stat--secondary">
                                    <span className="sim-stat__value">
                                        {intelLoading
                                            ? '—'
                                            : intel?.minSimilarity != null
                                                ? intel.minSimilarity.toFixed(2)
                                                : 'N/A'}
                                    </span>
                                    <span className="sim-stat__label">Min</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — Histogram */}
                    <div className="intel-panel">
                        <h3 className="intel-panel__title">Similarity Distribution</h3>
                        <div className="intel-panel__chart">
                            {intelLoading ? (
                                <div className="intel-panel__loading">Loading chart…</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={intel?.similarityDistribution ?? []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 10,
                                                border: '1px solid #e5e7eb',
                                                fontSize: 13,
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            name="Captions"
                                            radius={[6, 6, 0, 0]}
                                        >
                                            {(intel?.similarityDistribution ?? []).map(
                                                (_entry, idx) => {
                                                    const colors = [
                                                        '#ef4444',
                                                        '#f97316',
                                                        '#eab308',
                                                        '#22c55e',
                                                        '#10b981',
                                                    ];
                                                    return (
                                                        <Cell
                                                            key={`bar-${idx}`}
                                                            fill={colors[idx % colors.length]}
                                                        />
                                                    );
                                                }
                                            )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
