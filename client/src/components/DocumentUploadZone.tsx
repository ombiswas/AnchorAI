import React, { useRef, useState } from 'react';
import { api } from '../lib/api';
import type { StudyDocument } from '../types/document.types';

interface DocumentUploadZoneProps {
  onUploadSuccess: (doc: StudyDocument) => void;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({ onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    // PDF mime or extension check
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Only PDF documents are supported at this step.');
      return;
    }

    // 20MB limit
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage('File size exceeds the 20MB limit.');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      // Auto-populate title without .pdf extension
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setErrorMessage(null);

      const response = await api.documents.upload(
        selectedFile,
        title.trim() || undefined,
        subject.trim() || undefined,
        (percent) => {
          setUploadProgress(percent);
        }
      );

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setSubject('');
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess(response.document);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-[4px] border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <span className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-neutral-500">
          Document Ingestion · PDF
        </span>
        <h2 className="mt-1 text-lg font-medium tracking-tight text-neutral-950">
          Upload Study Material
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Upload lecture slides, chapters, or syllabus PDFs (max 20MB). Extraction runs
          asynchronously.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-start gap-2.5 rounded-[4px] border border-red-200 bg-red-50/70 p-3 text-xs text-red-800">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-[4px] border-2 border-dashed p-6 text-center transition ${
            isDragging
              ? 'border-neutral-900 bg-neutral-50'
              : selectedFile
                ? 'border-neutral-400 bg-neutral-50/50'
                : 'border-neutral-200 hover:border-neutral-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-neutral-100 text-neutral-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div className="mt-3">
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <span className="font-mono text-xs font-semibold text-neutral-900">
                  {selectedFile.name}
                </span>
                <span className="mt-0.5 font-mono text-[11px] text-neutral-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Click or drag to change
                </span>
              </div>
            ) : (
              <>
                <p className="text-xs font-medium text-neutral-800">
                  Drag and drop your PDF here, or{' '}
                  <span className="text-neutral-950 underline underline-offset-2">browse</span>
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  PDF format only · up to 20MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Optional Metadata Inputs */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="doc-title"
              className="block font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-700"
            >
              Document Title
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems Lecture 4"
              disabled={isUploading}
              className="mt-1 w-full rounded-[4px] border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="doc-subject"
              className="block font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-700"
            >
              Subject / Course
            </label>
            <input
              id="doc-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. CS 401 / Computer Science"
              disabled={isUploading}
              className="mt-1 w-full rounded-[4px] border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between font-mono text-[11px] text-neutral-600">
              <span>Uploading to storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full bg-black transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="inline-flex items-center justify-center rounded-[4px] bg-black px-5 py-2 font-mono text-xs font-medium uppercase tracking-[0.05em] text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Ingesting...
              </span>
            ) : (
              'Upload & Process'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
