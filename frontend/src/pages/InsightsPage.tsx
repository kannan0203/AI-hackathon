import React, { useContext, useEffect, useState } from 'react';
import { getInsights } from '../services/api';
import { AppContext } from '../App';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import NoDataState from '../components/NoDataState';
import { Lightbulb, TrendingUp, AlertTriangle, Award, MapPin } from 'lucide-react';
import type { Insight } from '../types';

const categoryIcons: Record<string, React.ReactNode> = {
  revenue: <TrendingUp className="w-5 h-5" />,
  product: <Award className="w-5 h-5" />,
  region: <MapPin className="w-5 h-5" />,
  trend: <TrendingUp className="w-5 h-5" />,
  anomaly: <AlertTriangle className="w-5 h-5" />,
};

const importanceColors: Record<string, string> = {
  high: 'bg-red-50 border-red-200 text-red-700',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  low: 'bg-gray-50 border-gray-200 text-gray-600',
};

const categoryColors: Record<string, string> = {
  revenue: 'text-blue-600 bg-blue-50',
  product: 'text-orange-600 bg-orange-50',
  region: 'text-cyan-600 bg-cyan-50',
  trend: 'text-green-600 bg-green-50',
  anomaly: 'text-red-600 bg-red-50',
};

function InsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);
  const evidenceEntries = Object.entries(insight.evidence);

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${categoryColors[insight.category] || 'text-blue-600 bg-blue-50'}`}>
          {categoryIcons[insight.category] || <Lightbulb className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${importanceColors[insight.importance] || importanceColors.low}`}>
              {insight.importance} priority
            </span>
          </div>
          <p className="text-gray-700 text-sm">{insight.description}</p>

          {evidenceEntries.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 text-sm mt-3 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              🔍 {expanded ? 'Hide Evidence' : 'View Evidence'}
            </button>
          )}

          {expanded && (
            <div className="mt-3 bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
              {evidenceEntries.map(([key, value]) => (
                <div key={key}>
                  <p className="text-gray-500 text-xs capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-gray-900 font-semibold text-sm">
                    {typeof value === 'number' && (key.includes('revenue') || key.includes('sales'))
                      ? `$${(value as number).toLocaleString()}`
                      : String(value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { appState } = useContext(AppContext);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInsights();
      setInsights(data.insights);
    } catch (_e: unknown) {
      setError('Failed to load insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appState.datasetLoaded) load();
  }, [appState.datasetLoaded, appState.uploadData]);

  if (!appState.datasetLoaded) return <NoDataState />;
  if (loading) return <LoadingState message="Generating insights..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Automatic Insights</h1>
        <p className="text-gray-500 text-sm mt-1">{insights.length} insights automatically generated from your data</p>
      </div>

      {insights.length === 0 ? (
        <div className="card text-center py-12">
          <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No insights available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
        </div>
      )}
    </div>
  );
}
