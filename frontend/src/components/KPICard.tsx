import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: string;
}

export default function KPICard({ title, value, subtitle, trend, icon, color = 'blue' }: Props) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.blue}`}>
            {icon}
          </div>
        )}
      </div>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
          trend >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{trend >= 0 ? '+' : ''}{trend.toFixed(1)}% MoM</span>
        </div>
      )}
    </div>
  );
}
