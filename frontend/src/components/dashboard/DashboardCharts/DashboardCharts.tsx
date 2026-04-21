import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import styles from './DashboardCharts.module.css';

/* ─── Types ──────────────────────────────────────────────────── */

interface DatasetInfo {
  id: number | string;
  name: string;
  totalItems?: number;
  averageSimilarity?: number | null;
  modelName?: string | null;
  createdAt?: string;
}

/* ─── 1. Dataset Trends Bar Chart ────────────────────────────── */

interface DatasetTrendsChartProps {
  datasets: DatasetInfo[];
}

export const DatasetTrendsChart: React.FC<DatasetTrendsChartProps> = ({ datasets }) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D'>('7D');

  const chartData = useMemo(() => {
    const days = timeRange === '7D' ? 7 : 30;
    const now = new Date();
    // Neutralize to start of day for accurate comparison
    now.setHours(0, 0, 0, 0);

    interface TrendData {
      dateString: string;
      label: string;
      count: number;
    }
    const data: TrendData[] = [];

    // Create buckets for the last N days (including today)
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Formatting label
      const label = timeRange === '7D'
        ? d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      data.push({
        dateString,
        label,
        count: 0
      });
    }

    // Aggregate datasets
    datasets.forEach(ds => {
      if (!ds.createdAt) return;

      const dDate = new Date(ds.createdAt);
      const dsDateString = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}-${String(dDate.getDate()).padStart(2, '0')}`;

      const bucket = data.find(b => b.dateString === dsDateString);
      if (bucket) {
        bucket.count += (ds.totalItems || 0);
      }
    });

    return data;
  }, [datasets, timeRange]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Dataset Trends</h3>
        <div className={styles.toggleGroup}>
          <button 
            className={`${styles.toggleBtn} ${timeRange === '7D' ? styles.toggleBtnActive : ''}`}
            onClick={() => setTimeRange('7D')}
          >
            7D
          </button>
          <button 
            className={`${styles.toggleBtn} ${timeRange === '30D' ? styles.toggleBtnActive : ''}`}
            onClick={() => setTimeRange('30D')}
          >
            30D
          </button>
        </div>
      </div>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7cff" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#6b7cff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#98979d', fontSize: 11, fontFamily: 'Outfit' }}
              minTickGap={timeRange === '30D' ? 15 : 0}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: '#1f1e29',
                border: '1px solid #3e3e47',
                borderRadius: '8px',
                color: '#f6f6f6',
                fontSize: '13px',
                fontFamily: 'Outfit',
              }}
              cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1, strokeDasharray: '4 4' }}
              labelFormatter={(label) => timeRange === '7D' ? label : label}
              formatter={(value: number | undefined) => [`${value?.toLocaleString() || 0} images`, 'Processed']}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#6b7cff" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCount)" 
              activeDot={{ r: 6, fill: '#6b7cff', stroke: '#1f1e29', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ─── 2. Model Distribution Donut ────────────────────────────── */

interface ModelDistributionChartProps {
  datasets: DatasetInfo[];
}

const DONUT_COLORS = ['#6b7cff', '#ffb74d', '#4fc3f7', '#81c784'];

export const ModelDistributionChart: React.FC<ModelDistributionChartProps> = ({ datasets }) => {
  // Count datasets per model
  const modelCounts: Record<string, number> = {};
  datasets.forEach((ds) => {
    const model = ds.modelName || 'Unknown';
    modelCounts[model] = (modelCounts[model] || 0) + 1;
  });

  const data = Object.entries(modelCounts).map(([name, value]) => ({ name, value }));

  // If no data, show placeholder
  if (data.length === 0) {
    data.push({ name: 'No Data', value: 1 });
  }

  // Find dominant model
  const dominant = data.reduce((a, b) => (a.value >= b.value ? a : b), data[0]);

  return (
    <div className={styles.cardSmall}>
      <h3 className={styles.cardTitle}>Model Distribution</h3>
      <div className={styles.donutContainer}>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.donutCenter}>
          <span className={styles.donutDominant}>{dominant.name === 'caption_model' ? 'AutoCap' : dominant.name === 'base_line_model' ? 'Baseline' : dominant.name}</span>
          <span className={styles.donutSub}>Dominant</span>
        </div>
      </div>
      <div className={styles.legendRow}>
        {data.map((entry, i) => (
          <span key={entry.name} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            {entry.name === 'caption_model' ? 'AutoCap V1' : entry.name === 'base_line_model' ? 'Baseline' : entry.name}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─── 3. Similarity Gauge ────────────────────────────────────── */

interface SimilarityGaugeProps {
  score: number | null; // 0-1
}

export const SimilarityGauge: React.FC<SimilarityGaugeProps> = ({ score }) => {
  const pct = score != null ? Math.min(100, Math.max(0, score * 100)) : 0;
  const displayPct = score != null ? `${pct.toFixed(1)}%` : 'N/A';

  return (
    <div className={styles.cardSmall}>
      <h3 className={styles.cardTitle}>Similarity Gauge</h3>
      <div className={styles.meterContainer}>
        <div className={styles.meterValue}>{displayPct}</div>
        <div className={styles.meterTrack}>
          <div className={styles.meterFill} style={{ width: `${score != null ? pct : 0}%` }} />
        </div>
        <div className={styles.meterScale}>
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <span className={styles.gaugeLabel}>
          Average coherence across<br />all generated meta-tags.
        </span>
      </div>
    </div>
  );
};
