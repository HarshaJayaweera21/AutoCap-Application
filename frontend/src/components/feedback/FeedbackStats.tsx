import React, { useEffect, useState } from 'react';
import { useFeedback } from '../../hooks/useFeedback';
import { FeedbackStatsData } from '../../types/feedback';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './feedback.css';

const FeedbackStats: React.FC = () => {
    const { getFeedbackStats, loading, error } = useFeedback();
    const [stats, setStats] = useState<FeedbackStatsData | null>(null);

    const fetchStats = async () => {
        const data = await getFeedbackStats();
        if (data) setStats(data);
    };

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading && !stats) {
        return (
            <div className="fb-module-container">
                <div className="fb-grid">
                    {[1, 2, 3, 4].map(n => <div key={n} className="fb-card fb-skeleton" style={{ height: '120px' }} />)}
                </div>
                <div className="fb-card fb-skeleton" style={{ height: '400px', marginTop: '1.5rem' }} />
            </div>
        );
    }

    if (error || !stats) {
        return <div className="fb-module-container"><div className="fb-text" style={{ color: 'var(--fb-error)' }}>Error loading stats: {error}</div></div>;
    }

    // Prepare data for Recharts
    const typeData = Object.entries(stats.type_distribution).map(([name, value]) => ({ name, value }));
    const COLORS = ['#194BFF', '#D8EE10', '#89EB79', '#A2B6FF', '#E84A34', '#C5C4C7'];

    const statusData = Object.entries(stats.status_breakdown).map(([name, value]) => ({ name, value }));

    return (
        <div className="fb-module-container">
            <h1 className="fb-h1">Feedback Analytics</h1>

            <div className="fb-grid" style={{ marginBottom: '2rem' }}>
                <div className="fb-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div className="fb-subtext">Total Feedback</div>
                    <div className="fb-large-num">{stats.total_count}</div>
                </div>

                <div className="fb-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div className="fb-subtext">Average Rating</div>
                    <div className="fb-large-num" style={{ color: 'var(--fb-accent)' }}>
                        {stats.average_rating.toFixed(1)} <span style={{ fontSize: '20px' }}>/ 5</span>
                    </div>
                </div>

                <div className="fb-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div className="fb-subtext">New Issues</div>
                    <div className="fb-large-num" style={{ color: 'var(--fb-text-primary)' }}>
                        {stats.status_breakdown['New'] || 0}
                    </div>
                </div>

                <div className="fb-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div className="fb-subtext">Resolved</div>
                    <div className="fb-large-num" style={{ color: 'var(--fb-success)' }}>
                        {stats.status_breakdown['Resolved'] || 0}
                    </div>
                </div>
            </div>

            <div className="fb-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="fb-card">
                    <h2 className="fb-h2">Feedback Type Distribution</h2>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {typeData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--fb-surface)', border: '1px solid var(--fb-border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--fb-text-primary)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="fb-card">
                    <h2 className="fb-h2">Status Breakdown</h2>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--fb-border)" horizontal={false} />
                                <XAxis type="number" stroke="var(--fb-text-secondary)" />
                                <YAxis dataKey="name" type="category" stroke="var(--fb-text-secondary)" width={100} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: 'var(--fb-surface)', border: '1px solid var(--fb-border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" fill="var(--fb-accent)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackStats;