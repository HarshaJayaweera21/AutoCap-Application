import React from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'accent' | 'info';
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

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  badge,
  badgeVariant = 'default',
  variant = 'primary',
  trend,
  onClick,
  isActive,
}) => {
  const interactiveProps = onClick ? { onClick, role: 'button', tabIndex: 0 } : {};

  // Auto-generate badge text from trend if no explicit badge
  const badgeText = badge ?? (trend
    ? `${trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}${trend.value}%`
    : undefined);

  const computedBadgeVariant = badge
    ? badgeVariant
    : trend
    ? trend.direction === 'up' ? 'success' : trend.direction === 'down' ? 'accent' : 'default'
    : badgeVariant;

  return (
    <div 
      className={`${styles.card} ${onClick ? styles.interactive : ''} ${isActive ? styles.activeFilter : ''}`}
      {...interactiveProps}
    >
      {/* Top row: icon + badge */}
      <div className={styles.topRow}>
        <div className={`${styles.iconWrap} ${styles[`icon_${variant}`]}`}>{icon}</div>
        {badgeText && (
          <span className={`${styles.badge} ${styles[`badge_${computedBadgeVariant}`]}`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Value */}
      <span className={styles.value}>{value}</span>

      {/* Label */}
      <span className={styles.label}>{label}</span>
    </div>
  );
};
