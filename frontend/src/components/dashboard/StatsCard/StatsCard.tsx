import React from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  variant?: 'primary' | 'accent' | 'success' | 'neutral';
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  sparklineData?: number[];
  onClick?: () => void;
  isActive?: boolean;
}

const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const dx = 100 / (data.length - 1);
  const points = data.map((d, i) => `${i * dx},${100 - ((d - min) / range) * 100}`).join(' ');

  return (
    <div className={styles.sparklineContainer}>
      <svg viewBox="0 -10 100 120" preserveAspectRatio="none" className={styles.sparkline}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  hint,
  variant = 'primary',
  trend,
  sparklineData,
  onClick,
  isActive,
}) => {
  // Map variant to a CSS color variable for the sparkline stroke
  const colorMap = {
    primary: 'var(--primary-light)',
    accent: 'var(--accent)',
    success: 'var(--success)',
    neutral: 'var(--border-strong)',
  };

  const interactiveProps = onClick ? { onClick, role: 'button', tabIndex: 0 } : {};

  return (
    <div 
      className={`${styles.card} ${onClick ? styles.interactive : ''} ${isActive ? styles.activeFilter : ''}`}
      {...interactiveProps}
    >
      <div className={`${styles.iconWrap} ${styles[`icon_${variant}`]}`}>{icon}</div>
      <div className={styles.body}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className={`${styles.value} ${styles[`value_${variant}`]}`}>{value}</span>
          {trend && (
            <span className={`${styles.trendPill} ${styles[`trend_${trend.direction}`]}`}>
              <span className={styles.trendIcon}>
                {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
              </span>
              {trend.value}% {trend.label}
            </span>
          )}
        </div>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
      {sparklineData && <Sparkline data={sparklineData} color={colorMap[variant]} />}
    </div>
  );
};
