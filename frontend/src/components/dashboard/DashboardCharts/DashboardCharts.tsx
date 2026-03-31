import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
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
  // Build day-of-week buckets from recent datasets
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const buckets = dayLabels.map(() => 0);

  // Distribute dataset image counts across days for visualization
  const reversed = [...datasets].reverse();
  reversed.forEach((ds, i) => {
    const idx = i % 7;
    buckets[idx] += ds.totalItems ?? 0;
  });

  const chartData = dayLabels.map((day, i) => ({ day, count: buckets[i] }));

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Dataset Trends</h3>
        <div className={styles.toggleGroup}>
          <button className={`${styles.toggleBtn} ${styles.toggleBtnActive}`}>7D</button>
          <button className={styles.toggleBtn}>30D</button>
        </div>
      </div>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#98979d', fontSize: 11, fontFamily: 'Outfit' }}
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
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              formatter={(value: number | undefined) => [`${value?.toLocaleString() || 0} images`, 'Processed']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={42}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === chartData.length - 2 ? '#6b7cff' : '#3a3f6b'}
                  fillOpacity={0.45 + (index / chartData.length) * 0.55}
                />
              ))}
            </Bar>
          </BarChart>
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
            {entry.name === 'caption_model' ? 'AutoCap' : entry.name === 'base_line_model' ? 'Baseline' : entry.name}
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
