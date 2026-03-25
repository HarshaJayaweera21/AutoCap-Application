import React from 'react';

interface DatasetNameInputProps {
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  disabled: boolean;
}

export const DatasetNameInput: React.FC<DatasetNameInputProps> = ({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  disabled,
}) => {
  const now = new Date();
  const autoName = `Dataset — ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-regular)' }}>
            Dataset Name
          </label>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {name.length}/100
          </span>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, 100))}
          placeholder="e.g. University Corridors — February 2026"
          disabled={disabled}
          style={{ width: '100%' }}
        />
        {!name.trim() && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
            Will be saved as: {autoName}
          </p>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-regular)' }}>
            Description <span style={{ color: 'var(--text-muted)', fontWeight: 'var(--weight-regular)' }}>(optional)</span>
          </label>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {description.length}/500
          </span>
        </div>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value.slice(0, 500))}
          placeholder="Brief description of this dataset..."
          disabled={disabled}
          rows={3}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};
