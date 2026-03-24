import React, { useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SelectedFile } from '../../../types/dashboard.types';
import styles from './UploadZone.module.css';

interface UploadZoneProps {
  selectedFiles: SelectedFile[];
  onFilesAdded: (files: SelectedFile[]) => void;
  onFileRemoved: (id: string) => void;
  disabled: boolean;
}

const MAX_FILES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const UploadZone: React.FC<UploadZoneProps> = ({
  selectedFiles,
  onFilesAdded,
  onFileRemoved,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndAddFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      setError(null);

      // Check total file count
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
      // Reset input so same file can be re-selected
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          className={styles.hiddenInput}
          disabled={disabled}
        />

        <div className={styles.dropContent}>
          <div className={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

      {selectedFiles.length > 0 && (
        <>
          <div className={styles.counter}>
            {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected — {totalSizeMB} MB
          </div>
          <div className={styles.thumbnailGrid}>
            {selectedFiles.map((sf) => (
              <div key={sf.id} className={styles.thumbnailCard}>
                <img src={sf.previewUrl} alt={sf.file.name} className={styles.thumbnail} />
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
                <div className={styles.thumbnailInfo}>
                  <span className={styles.thumbnailName} title={sf.file.name}>
                    {sf.file.name.length > 14
                      ? sf.file.name.substring(0, 11) + '...'
                      : sf.file.name}
                  </span>
                  <span className={styles.thumbnailSize}>
                    {formatFileSize(sf.file.size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
