import React, { useContext, useEffect, useState } from 'react';
import { getAnomalies } from '../services/api';
import { AppContext } from '../App';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import NoDataState from '../components/NoDataState';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { Anomaly } from '../types';

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const [expanded, setExpanded] = useState(false);
  const isHigh = anomaly.severity === 'high';

  return (
    <div className={`card border-l-4 ${isHigh ? 'border-l-red-500' : 'border-l-amber-400'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isHigh ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isHigh ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {isHigh ? '⚠ HIGH' : 'MEDIUM'} ANOMALY
              </span>
              <span className="text-gray-500 text-sm">Column: <strong>{anomaly.column}</strong></span>
            </div>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="text-gray-700">
                Value: <strong className={isHigh ? 'text-red-600' : 'text-amber-600'}>{anomaly.value.toLocaleString()}</strong>
              </span>
              <span className="text-gray-500">
                Expected: [{anomaly.lower_bound.toLocaleString()} – {anomaly.upper_bound.toLocaleString()}]
              </span>
            </div>
            {(anomaly.product || anomaly.region || anomaly.date) && (
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                {anomaly.date && <span>📅 {anomaly.date.split('T')[0]}</span>}
                {anomaly.product && <span>📦 {anomaly.product}</span>}
                {anomaly.region && <span>📍 {anomaly.region}</span>}
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-blue-700 text-sm">
              Potential anomaly detected based on statistical threshold (IQR method). This does not necessarily indicate
              fraud or error — it simply falls outside the expected range.
            </p>
          </div>
          {Object.keys(anomaly.source_row).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(anomaly.source_row).map(k => (
                      <th key={k} className="text-left py-2 px-3 text-gray-600 font-semibold whitespace-nowrap">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Object.values(anomaly.source_row).map((v, i) => (
                      <td key={i} className="py-2 px-3 text-gray-700 whitespace-nowrap">{String(v)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnomaliesPage() {
  const { appState } = useContext(AppContext);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnomalies();
      setAnomalies(data.anomalies);
    } catch (_e: unknown) {
      setError('Failed to load anomalies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appState.datasetLoaded) load();
  }, [appState.datasetLoaded, appState.uploadData]);

  if (!appState.datasetLoaded) return <NoDataState />;
  if (loading) return <LoadingState message="Running anomaly detection..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const highAnomalies = anomalies.filter(a => a.severity === 'high');
  const medAnomalies = anomalies.filter(a => a.severity !== 'high');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Anomaly Detection</h1>
        <p className="text-gray-500 text-sm mt-1">Statistical outlier detection using IQR method</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{anomalies.length}</p>
          <p className="text-gray-500 text-sm">Total Anomalies</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-600">{highAnomalies.length}</p>
          <p className="text-gray-500 text-sm">High Severity</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-600">{medAnomalies.length}</p>
          <p className="text-gray-500 text-sm">Medium Severity</p>
        </div>
      </div>

      {/* Method Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-blue-900 font-semibold mb-2">Detection Method: IQR (Interquartile Range)</h3>
        <div className="text-blue-800 text-sm space-y-1">
          <p>• IQR = Q3 − Q1 (middle 50% of data spread)</p>
          <p>• Lower Bound = Q1 − 1.5 × IQR</p>
          <p>• Upper Bound = Q3 + 1.5 × IQR</p>
          <p>• Values outside these bounds are flagged as potential anomalies</p>
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold">No anomalies detected!</p>
          <p className="text-gray-500 text-sm mt-1">All values fall within the expected statistical range.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...highAnomalies, ...medAnomalies].map((anomaly, i) => (
            <AnomalyCard key={i} anomaly={anomaly} />
          ))}
        </div>
      )}
    </div>
  );
}
