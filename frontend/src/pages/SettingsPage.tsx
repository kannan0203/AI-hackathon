import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Settings, Database, Brain, Shield, Info } from 'lucide-react';

export default function SettingsPage() {
  const { appState } = useContext(AppContext);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Application configuration and information</p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" /> AI Configuration
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">AI Mode</p>
              <p className="text-gray-500 text-sm">Current operating mode</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              appState.demoMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
            }`}>
              {appState.demoMode ? 'Demo Mode' : 'AI Mode'}
            </span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-blue-900 font-medium text-sm">Configure Google Gemini API Key</p>
                <p className="text-blue-800 text-sm mt-1">
                  Get a <strong>free</strong> key at{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                    className="underline font-medium">aistudio.google.com</a>
                  {' '}then add it to the <code className="bg-blue-100 px-1 rounded">.env</code> file:
                </p>
                <code className="block mt-2 bg-blue-900 text-blue-100 p-2 rounded text-xs">
                  GOOGLE_API_KEY=your_key_here
                </code>
                <p className="text-blue-700 text-xs mt-2">Then restart the backend server.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-green-500" /> Dataset Information
        </h3>
        {appState.uploadData ? (
          <div className="space-y-2">
            {[
              { label: 'Filename', value: appState.uploadData.filename },
              { label: 'Rows', value: appState.uploadData.rows.toLocaleString() },
              { label: 'Columns', value: String(appState.uploadData.columns) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No dataset loaded.</p>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-500" /> Security & Privacy
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• API keys are never stored in the database</p>
          <p>• Only aggregated data is sent to the AI (not raw records)</p>
          <p>• Uploaded files are stored locally on the server</p>
          <p>• All analysis happens server-side for data privacy</p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" /> About BizInsight AI
        </h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Tagline:</strong> "From Raw Data to Explainable Decisions."</p>
          <p><strong>Backend:</strong> FastAPI + Python</p>
          <p><strong>Frontend:</strong> React + TypeScript + Vite</p>
          <p><strong>AI:</strong> Google Gemini 1.5 Flash (or Demo Mode)</p>
          <p><strong>Database:</strong> SQLite</p>
        </div>
      </div>
    </div>
  );
}
