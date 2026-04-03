import React, { useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SelectedFile } from '../../../types/dashboard.types';
import styles from './UploadZone.module.css';

interface UploadZoneProps {
  selectedFiles: SelectedFile[];
  onFilesAdded: (files: SelectedFile[]) => void;
  onFileRemoved: (id: string) => void;
  onClearAll: () => void;
  disabled: boolean;
}

const MAX_FILES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const UploadZone: React.FC<UploadZoneProps> = ({
  selectedFiles,
  onFilesAdded,
  onFileRemoved,
  onClearAll,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showViewAll, setShowViewAll] = useState(false);

  const validateAndAddFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      setError(null);

      if (selectedFiles.length + files.length > MAX_FILES) {
        setError(`Max ${MAX_FILES} images per batch. You already have ${selectedFiles.length} selected.`);
        return;
      }

      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`"${file.name}" is not a supported format (JPEG, PNG, WebP only).`);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`"${file.name}" exceeds the 10 MB size limit.`);
          return;
        }
      }

      const newFiles: SelectedFile[] = files.map((file) => ({
        id: uuidv4(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      onFilesAdded(newFiles);
    },
    [selectedFiles.length, onFilesAdded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      validateAndAddFiles(e.dataTransfer.files);
    },
    [disabled, validateAndAddFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        validateAndAddFiles(e.target.files);
      }
      e.target.value = '';
    },
    [validateAndAddFiles]
  );

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const totalSizeMB = (
    selectedFiles.reduce((acc, f) => acc + f.file.size, 0) /
    (1024 * 1024)
  ).toFixed(1);

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        className={styles.hiddenInput}
        disabled={disabled}
      />

      {/* If no files yet, show drop zone */}
      {!hasFiles && (
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className={styles.dropContent}>
            <div className={styles.icon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className={styles.dropText}>
              {isDragging ? 'Drop images here' : 'Drag & drop images here, or click to browse'}
            </p>
            <p className={styles.dropHint}>
              JPEG, PNG, or WebP • Max 10 MB per file • Up to 50 images
            </p>
          </div>
        </div>
      )}

      {/* If files exist, show horizontal scroll strip */}
      {hasFiles && (
        <div
          className={`${styles.stripContainer} ${isDragging ? styles.dragging : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className={styles.stripHeader}>
            <div className={styles.metrics}>
              <strong>{selectedFiles.length}</strong> image{selectedFiles.length !== 1 ? 's' : ''} • <strong>{totalSizeMB} MB</strong>
            </div>
            <div className={styles.stripActions}>
              <button className={styles.stripBtn} onClick={() => setShowViewAll(true)} disabled={disabled}>
                View All
              </button>
              <button className={styles.stripBtn} onClick={handleClick} disabled={disabled}>
                + Add More
              </button>
              {!disabled && (
                <button className={styles.clearAllBtn} onClick={onClearAll}>
                  Remove All
                </button>
              )}
            </div>
          </div>

          <div className={styles.horizontalScroll}>
            {selectedFiles.map((sf) => (
              <div key={sf.id} className={styles.stripThumb}>
                <img src={sf.previewUrl} alt={sf.file.name} className={styles.stripThumbImg} />
                {!disabled && (
                  <button
                    className={styles.removeBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemoved(sf.id);
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* View All Modal */}
      {showViewAll && (
        <div className={styles.modalOverlay} onClick={() => setShowViewAll(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Selected Images ({selectedFiles.length})
              </h3>
              <button className={styles.modalClose} onClick={() => setShowViewAll(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {selectedFiles.map((sf) => (
                <div key={sf.id} className={styles.modalItem}>
                  <img src={sf.previewUrl} alt={sf.file.name} className={styles.modalThumb} />
                  <div className={styles.modalItemInfo}>
                    <span className={styles.modalItemName}>{sf.file.name}</span>
                    <span className={styles.modalItemSize}>
                      {sf.file.size < 1024 * 1024
                        ? `${(sf.file.size / 1024).toFixed(1)} KB`
                        : `${(sf.file.size / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                  </div>
                  {!disabled && (
                    <button
                      className={styles.modalRemoveBtn}
                      onClick={() => onFileRemoved(sf.id)}
                    >
                      Deselect
                    </button>
                  )}
                </div>
              ))}
              {selectedFiles.length === 0 && (
                <p className={styles.modalEmpty}>All images have been removed.</p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalDoneBtn} onClick={() => setShowViewAll(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
