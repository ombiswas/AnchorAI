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

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name.toLowerCase());

    if (!isPdf && !isImage) {
      setErrorMessage(
        'Unsupported file format. Please upload a PDF or an image (.jpg, .jpeg, .png, .webp).'
      );
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
      // Auto-populate title without extension
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
      setErrorMessage('Please select a PDF or image file to upload.');
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

  const isSelectedFileImage =
    selectedFile &&
    (selectedFile.type.startsWith('image/') ||
      /\.(jpe?g|png|webp)$/i.test(selectedFile.name.toLowerCase()));

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            Document Ingestion · PDF & Images (OCR)
          </span>
          <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-700">
            Handwritten Notes Ready
          </span>
        </div>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-neutral-950">
          Upload Study Material
        </h2>
        <p className="mt-0.5 text-xs text-neutral-600">
          Upload PDFs (slides, chapters) or photographed handwritten notes (PNG, JPG, WebP up to
          20MB). Handwritten images are transcribed with hybrid OCR.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-start gap-2.5 rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-900">
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
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition ${
            isDragging
              ? 'border-neutral-900 bg-neutral-100/50'
              : selectedFile
                ? 'border-neutral-400 bg-neutral-50/70'
                : 'border-neutral-300 bg-neutral-50/30 hover:border-neutral-900 hover:bg-neutral-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 shadow-2xs">
            {isSelectedFileImage ? (
              <svg
                className="h-5 w-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
          </div>

          <div className="mt-3.5">
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-neutral-950">
                    {selectedFile.name}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                      isSelectedFileImage
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-neutral-200 text-neutral-800'
                    }`}
                  >
                    {isSelectedFileImage ? 'IMAGE (OCR)' : 'PDF'}
                  </span>
                </div>
                <span className="mt-1 font-mono text-xs text-neutral-600">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Click or drag another file
                  to replace
                </span>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-neutral-900">
                  Drag and drop your PDF or notes image here, or{' '}
                  <span className="underline underline-offset-2 hover:text-black">
                    browse files
                  </span>
                </p>
                <p className="mt-1 font-mono text-xs text-neutral-500 uppercase tracking-wider">
                  PDF, JPG, PNG, WebP · up to 20MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Optional Metadata Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="doc-title"
              className="block font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700"
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
              className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="doc-subject"
              className="block font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700"
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
              className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between font-mono text-xs font-medium text-neutral-700">
              <span>Uploading and initiating vector ingestion...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full bg-neutral-950 transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="inline-flex items-center justify-center rounded-md bg-neutral-950 px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-40 shadow-sm"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
