import React, { useContext, useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Award, MapPin, Users, AlertTriangle, Activity } from 'lucide-react';
import { getDashboard } from '../services/api';
import KPICard from '../components/KPICard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import NoDataState from '../components/NoDataState';
import { AppContext } from '../App';
import type { DashboardData } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const formatCurrency = (v: number) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

export default function Dashboard() {
  const { appState } = useContext(AppContext);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getDashboard();
      setData(d);
    } catch (e: unknown) {
      const msg = (e as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Failed to load dashboard.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appState.datasetLoaded) load();
  }, [appState.datasetLoaded, appState.uploadData]);

  if (!appState.datasetLoaded) return <NoDataState />;
  if (loading) return <LoadingState message="Analyzing your data..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { kpis, profile, anomaly_count, charts } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time analysis of {data.filename}</p>
        </div>
        {data.demo_mode && (
          <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium">Demo Mode</span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.total_revenue !== undefined && (
          <KPICard
            title="Total Revenue"
            value={formatCurrency(kpis.total_revenue)}
            subtitle={`From ${profile.total_rows.toLocaleString()} transactions`}
            trend={kpis.growth_pct}
            icon={<DollarSign className="w-5 h-5" />}
            color="blue"
          />
        )}
        {kpis.avg_revenue !== undefined && (
          <KPICard
            title="Avg Transaction"
            value={formatCurrency(kpis.avg_revenue)}
            subtitle="Per transaction average"
            icon={<Activity className="w-5 h-5" />}
            color="green"
          />
        )}
        {kpis.total_quantity !== undefined && (
          <KPICard
            title="Total Quantity"
            value={kpis.total_quantity.toLocaleString()}
            subtitle="Units sold"
            icon={<ShoppingCart className="w-5 h-5" />}
            color="purple"
          />
        )}
        {kpis.top_product && (
          <KPICard
            title="Top Product"
            value={kpis.top_product}
            subtitle="Highest revenue product"
            icon={<Award className="w-5 h-5" />}
            color="orange"
          />
        )}
        {kpis.best_region && (
          <KPICard
            title="Best Region"
            value={kpis.best_region}
            subtitle="Highest sales region"
            icon={<MapPin className="w-5 h-5" />}
            color="cyan"
          />
        )}
        {kpis.num_customers !== undefined && (
          <KPICard
            title="Customer Segments"
            value={kpis.num_customers}
            subtitle="Unique customer types"
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
        )}
        <KPICard
          title="Anomalies Detected"
          value={anomaly_count}
          subtitle="Statistical outliers found"
          icon={<AlertTriangle className="w-5 h-5" />}
          color={anomaly_count > 0 ? 'red' : 'green'}
        />
        <KPICard
          title="Data Quality"
          value={`${profile.data_quality_score}%`}
          subtitle={`${profile.missing_values} missing, ${profile.duplicate_rows} duplicates`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        {charts.revenue_trend.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={charts.revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v as number)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sales by Product */}
        {charts.sales_by_product.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Product</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.sales_by_product.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v as number)} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="product" width={100} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {charts.sales_by_product.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Region */}
        {charts.sales_by_region.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Region</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={charts.sales_by_region}
                  dataKey="revenue"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ region, percent }: { region: string; percent: number }) => `${region} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {charts.sales_by_region.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Performance */}
        {charts.sales_by_category.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.sales_by_category}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v as number)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {charts.sales_by_category.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Data Quality */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Rows', value: profile.total_rows.toLocaleString() },
              { label: 'Total Columns', value: String(profile.total_columns) },
              { label: 'Missing Values', value: String(profile.missing_values) },
              { label: 'Duplicate Rows', value: String(profile.duplicate_rows) },
              { label: 'Numeric Columns', value: String(profile.numeric_columns.length) },
              { label: 'Categorical Columns', value: String(profile.categorical_columns.length) },
              { label: 'Date Columns', value: String(profile.date_columns.length) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                <span className="text-gray-600 text-sm">{label}</span>
                <span className="font-semibold text-gray-900 text-sm">{value}</span>
              </div>
            ))}
            <div className="mt-3 pt-3">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 text-sm">Quality Score</span>
                <span className="font-semibold text-gray-900 text-sm">{profile.data_quality_score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${profile.data_quality_score > 80 ? 'bg-green-500' : profile.data_quality_score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${profile.data_quality_score}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
