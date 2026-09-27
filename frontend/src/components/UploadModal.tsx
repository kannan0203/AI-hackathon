import React, { useCallback, useContext, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { uploadFile, loadSampleData } from '../services/api';
import { AppContext } from '../App';
import type { UploadResponse } from '../types';

interface Props {
  onClose: () => void;
}

export default function UploadModal({ onClose }: Props) {
  const { setAppState } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const data = await uploadFile(file);
      setResult(data);
      setAppState({ datasetLoaded: true, uploadData: data, demoMode: false });
    } catch (e: unknown) {
      const msg = (e as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) handleUpload(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  const handleLoadSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadSampleData();
      setResult(data);
      setAppState({ datasetLoaded: true, uploadData: data, demoMode: false });
    } catch (_e: unknown) {
      setError('Failed to load sample data.');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Upload Business Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input {...getInputProps()} />
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-gray-600 font-medium">Processing your data...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <div>
                      <p className="text-gray-700 font-medium">
                        {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                    </div>
                    <p className="text-gray-400 text-xs">Supports CSV, XLSX, XLS • Max 50MB</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-gray-500 text-sm">or</span></div>
              </div>

              <button
                onClick={handleLoadSample}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl py-3 font-medium transition-colors disabled:opacity-50"
              >
                <FileText className="w-5 h-5" />
                Use Sample Business Data
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-semibold">Data loaded successfully!</p>
                  <p className="text-green-700 text-sm">{result.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'File Name', value: result.filename },
                  { label: 'File Size', value: formatSize(result.file_size) },
                  { label: 'Total Rows', value: result.rows.toLocaleString() },
                  { label: 'Total Columns', value: String(result.columns) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">{label}</p>
                    <p className="text-gray-900 font-semibold text-sm">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Columns detected:</p>
                <div className="flex flex-wrap gap-2">
                  {result.column_names.map(col => (
                    <span key={col} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{col}</span>
                  ))}
                </div>
              </div>

              <button onClick={onClose} className="w-full btn-primary py-3">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
