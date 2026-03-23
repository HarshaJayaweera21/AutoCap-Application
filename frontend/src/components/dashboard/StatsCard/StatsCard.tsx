import React from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  variant?: 'primary' | 'accent' | 'success' | 'neutral';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  hint,
  variant = 'primary',
}) => {
  return (
    <div className={styles.card}>
      <div className={`${styles.iconWrap} ${styles[`icon_${variant}`]}`}>{icon}</div>
      <div className={styles.body}>
        <span className={`${styles.value} ${styles[`value_${variant}`]}`}>{value}</span>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
    </div>
  );
};
