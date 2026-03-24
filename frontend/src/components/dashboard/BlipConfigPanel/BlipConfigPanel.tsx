import React, { useState } from 'react';
import type { BlipConfig } from '../../../types/dashboard.types';
import { DEFAULT_BLIP_CONFIG } from '../../../types/dashboard.types';
import styles from './BlipConfigPanel.module.css';

interface BlipConfigPanelProps {
  config: BlipConfig;
  onChange: (config: BlipConfig) => void;
}

interface ParamDef {
  key: keyof BlipConfig;
  label: string;
  tooltip: string;
  min: number;
  max: number;
  step: number;
  type: 'slider' | 'select';
  options?: { value: string; label: string }[];
}

const PARAMS: ParamDef[] = [
  {
    key: 'modelVariant',
    label: 'Model Variant',
    tooltip: 'BLIP model size. blip-large is more accurate but slower.',
    min: 0, max: 0, step: 0,
    type: 'select',
    options: [
      { value: 'blip-base', label: 'BLIP Base' },
      { value: 'blip-large', label: 'BLIP Large' },
    ],
  },
  {
    key: 'temperature',
    label: 'Temperature',
    tooltip: 'Controls randomness. Higher = more creative, lower = more deterministic.',
    min: 0.1, max: 2.0, step: 0.1,
    type: 'slider',
  },
  {
    key: 'maxLength',
    label: 'Max Length',
    tooltip: 'Maximum number of tokens in the generated caption.',
    min: 10, max: 200, step: 1,
    type: 'slider',
  },
  {
    key: 'minLength',
    label: 'Min Length',
    tooltip: 'Minimum number of tokens — prevents very short captions.',
    min: 1, max: 50, step: 1,
    type: 'slider',
  },
  {
    key: 'numBeams',
    label: 'Beam Width',
    tooltip: 'Beam search width. Higher = better quality but slower.',
    min: 1, max: 10, step: 1,
    type: 'slider',
  },
  {
    key: 'repetitionPenalty',
    label: 'Repetition Penalty',
    tooltip: 'Penalises repeated words. Values > 1.0 reduce repetition.',
    min: 1.0, max: 2.0, step: 0.1,
    type: 'slider',
  },
  {
    key: 'topP',
    label: 'Top-P (Nucleus Sampling)',
    tooltip: 'Nucleus sampling threshold. Lower = more conservative word choices.',
    min: 0.0, max: 1.0, step: 0.05,
    type: 'slider',
  },
];

export const BlipConfigPanel: React.FC<BlipConfigPanelProps> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [captionLength, setCaptionLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [creativity, setCreativity] = useState<'low' | 'balanced' | 'high'>('balanced');

  const handleChange = (key: keyof BlipConfig, value: string | number) => {
    onChange({ ...config, [key]: value });
  };

  const handleLengthChange = (len: 'short' | 'medium' | 'detailed') => {
    setCaptionLength(len);
    let min = 5, max = 50;
    if (len === 'short') { min = 2; max = 20; }
    else if (len === 'detailed') { min = 20; max = 100; }
    onChange({ ...config, minLength: min, maxLength: max });
  };

  const handleCreativityChange = (val: 'low' | 'balanced' | 'high') => {
    setCreativity(val);
    let temp = 1.0, top = 0.9, rep = 1.0, beams = 4;
    if (val === 'low') { temp = 0.5; top = 0.8; rep = 1.2; beams = 4; }
    else if (val === 'high') { temp = 1.5; top = 0.95; rep = 0.9; beams = 5; }
    onChange({ ...config, temperature: temp, topP: top, repetitionPenalty: rep, numBeams: beams });
  };

  const handleReset = () => {
    setCaptionLength('medium');
    setCreativity('balanced');
    onChange({ ...DEFAULT_BLIP_CONFIG });
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.header}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className={styles.headerLeft}>
          <svg
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className={styles.headerTitle}>Model Configuration</span>
        </div>
        <span className={styles.headerBadge}>{config.modelVariant}</span>
      </button>

      {isOpen && (
        <div className={styles.body}>
          <div className={styles.modeToggle}>
            <button 
              className={`${styles.modeTab} ${!isAdvancedMode ? styles.modeTabActive : ''}`}
              onClick={() => setIsAdvancedMode(false)}
              type="button"
            >
              Basic
            </button>
            <button 
              className={`${styles.modeTab} ${isAdvancedMode ? styles.modeTabActive : ''}`}
              onClick={() => setIsAdvancedMode(true)}
              type="button"
            >
              Advanced
            </button>
          </div>

          {!isAdvancedMode ? (
            <div className={styles.basicContainer}>
              <div className={styles.basicGroup}>
                <span className={styles.basicLabel}>Caption Length</span>
                <div className={styles.pillGroup}>
                  {(['short', 'medium', 'detailed'] as const).map(len => (
                    <button
                      key={len}
                      type="button"
                      className={`${styles.pill} ${captionLength === len ? styles.pillActive : ''}`}
                      onClick={() => handleLengthChange(len)}
                    >
                      {len.charAt(0).toUpperCase() + len.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.basicGroup}>
                <span className={styles.basicLabel}>Creativity</span>
                <div className={styles.pillGroup}>
                  {(['low', 'balanced', 'high'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.pill} ${creativity === c ? styles.pillActive : ''}`}
                      onClick={() => handleCreativityChange(c)}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {PARAMS.map((param) => (
                <div key={param.key} className={styles.paramRow}>
                  <div className={styles.paramLabel}>
                    <span>{param.label}</span>
                    <button
                      className={styles.tooltipBtn}
                      onMouseEnter={() => setActiveTooltip(param.key)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      type="button"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      {activeTooltip === param.key && (
                        <div className={styles.tooltip}>{param.tooltip}</div>
                      )}
                    </button>
                  </div>

                  <div className={styles.paramControl}>
                    {param.type === 'select' ? (
                      <select
                        value={config[param.key] as string}
                        onChange={(e) => handleChange(param.key, e.target.value)}
                        className={styles.select}
                      >
                        {param.options!.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className={styles.sliderGroup}>
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={config[param.key] as number}
                          onChange={(e) => handleChange(param.key, parseFloat(e.target.value))}
                          className={styles.slider}
                        />
                        <span className={styles.sliderValue}>
                          {typeof config[param.key] === 'number'
                            ? (config[param.key] as number).toFixed(
                                param.step < 1 ? (param.step < 0.1 ? 2 : 1) : 0
                              )
                            : config[param.key]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          <button className={styles.resetBtn} onClick={handleReset} type="button">
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
};
