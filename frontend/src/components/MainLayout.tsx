import React, { useContext, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Search, MessageSquare, Lightbulb,
  AlertTriangle, Compass, Settings, Brain, Upload,
  ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { AppContext } from '../App';
import UploadModal from './UploadModal';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/explorer', icon: Search, label: 'Data Explorer' },
  { path: '/analyst', icon: MessageSquare, label: 'AI Analyst' },
  { path: '/insights', icon: Lightbulb, label: 'Insights' },
  { path: '/anomalies', icon: AlertTriangle, label: 'Anomalies' },
  { path: '/decision', icon: Compass, label: 'Decision Assistant' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function MainLayout() {
  const { appState } = useContext(AppContext);
  const [collapsed, setCollapsed] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-900 flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Brain className="w-7 h-7 text-blue-400 flex-shrink-0" />
              <span className="text-white font-bold text-lg">BizInsight AI</span>
            </div>
          )}
          {collapsed && <Brain className="w-7 h-7 text-blue-400 mx-auto" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Demo Mode Banner */}
        {appState.demoMode && !collapsed && (
          <div className="mx-3 mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            <p className="text-amber-400 text-xs font-medium">Demo Mode</p>
            <p className="text-amber-300/70 text-xs">AI API not configured</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Upload Button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setShowUpload(true)}
            className={`w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 transition-colors ${
              collapsed ? 'justify-center px-2' : 'px-3'
            }`}
          >
            <Upload className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Upload Data</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            {appState.uploadData && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium text-gray-900">{appState.uploadData.filename}</span>
                <span className="text-gray-400">•</span>
                <span>{appState.uploadData.rows.toLocaleString()} rows</span>
                <span className="text-gray-400">•</span>
                <span>{appState.uploadData.columns} columns</span>
              </div>
            )}
            {!appState.uploadData && (
              <p className="text-gray-500 text-sm">No dataset loaded — upload a file or try demo</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {appState.demoMode && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-amber-700 text-sm font-medium">Demo Mode</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Upload Modal */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
