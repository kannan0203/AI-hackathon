import React, { useContext, useEffect, useState } from 'react';
import { getDataset, getProfile } from '../services/api';
import { AppContext } from '../App';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import NoDataState from '../components/NoDataState';
import { Database, Table, Hash, Type, Calendar } from 'lucide-react';
import type { DataProfile } from '../types';

interface DatasetInfo {
  column_names: string[];
  preview: Record<string, string>[];
  rows: number;
  columns: number;
  detected_columns: Record<string, string | null>;
}

export default function DataExplorer() {
  const { appState } = useContext(AppContext);
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [profile, setProfile] = useState<DataProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ds, pr] = await Promise.all([getDataset(), getProfile()]);
      setDataset(ds as DatasetInfo);
      setProfile(pr);
    } catch (_e: unknown) {
      setError('Failed to load dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appState.datasetLoaded) load();
  }, [appState.datasetLoaded, appState.uploadData]);

  if (!appState.datasetLoaded) return <NoDataState />;
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!dataset) return null;

  const getColumnType = (col: string) => {
    if (profile?.numeric_columns.includes(col)) return { label: 'Numeric', icon: Hash, color: 'text-blue-600 bg-blue-50' };
    if (profile?.date_columns.includes(col)) return { label: 'Date', icon: Calendar, color: 'text-green-600 bg-green-50' };
    return { label: 'Text', icon: Type, color: 'text-purple-600 bg-purple-50' };
  };

  const getDetectedRole = (col: string) => {
    if (!dataset.detected_columns) return null;
    const entry = Object.entries(dataset.detected_columns).find(([, v]) => v === col);
    return entry ? entry[0] : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Explorer</h1>
        <p className="text-gray-500 text-sm mt-1">{dataset.rows.toLocaleString()} rows × {dataset.columns} columns</p>
      </div>

      {/* Column Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <Hash className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{profile?.numeric_columns.length || 0}</p>
          <p className="text-gray-500 text-sm">Numeric Columns</p>
        </div>
        <div className="card text-center">
          <Type className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{profile?.categorical_columns.length || 0}</p>
          <p className="text-gray-500 text-sm">Text Columns</p>
        </div>
        <div className="card text-center">
          <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{profile?.date_columns.length || 0}</p>
          <p className="text-gray-500 text-sm">Date Columns</p>
        </div>
      </div>

      {/* Columns */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" /> Column Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dataset.column_names.map(col => {
            const typeInfo = getColumnType(col);
            const Icon = typeInfo.icon;
            const role = getDetectedRole(col);
            return (
              <div key={col} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm truncate">{col}</span>
                  <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                    <Icon className="w-3 h-3" />
                    {typeInfo.label}
                  </div>
                </div>
                {role && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Detected: {role}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Preview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Table className="w-5 h-5" /> Data Preview (First 10 rows)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {dataset.column_names.map(col => (
                  <th key={col} className="text-left py-2 px-3 text-gray-600 font-semibold whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.preview.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {dataset.column_names.map(col => (
                    <td key={col} className="py-2 px-3 text-gray-700 whitespace-nowrap max-w-xs truncate">{String(row[col] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
