import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import DataExplorer from './pages/DataExplorer';
import AIAnalyst from './pages/AIAnalyst';
import InsightsPage from './pages/InsightsPage';
import AnomaliesPage from './pages/AnomaliesPage';
import DecisionAssistant from './pages/DecisionAssistant';
import SettingsPage from './pages/SettingsPage';
import { loadSampleData, healthCheck } from './services/api';
import type { UploadResponse } from './types';

export type AppState = {
  datasetLoaded: boolean;
  uploadData: UploadResponse | null;
  demoMode: boolean;
};

export const AppContext = React.createContext<{
  appState: AppState;
  setAppState: (s: AppState) => void;
}>({
  appState: { datasetLoaded: false, uploadData: null, demoMode: false },
  setAppState: () => {},
});

function App() {
  const [appState, setAppState] = useState<AppState>({
    datasetLoaded: false,
    uploadData: null,
    demoMode: false,
  });
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    healthCheck().then(data => {
      setAppState(prev => ({ ...prev, demoMode: data.demo_mode, datasetLoaded: data.dataset_loaded }));
    }).catch(() => {});
  }, []);

  const handleGetStarted = () => setShowApp(true);

  const handleTryDemo = async () => {
    try {
      const data = await loadSampleData();
      setAppState({ datasetLoaded: true, uploadData: data, demoMode: true });
      setShowApp(true);
    } catch (e) {
      console.error('Failed to load demo:', e);
      setShowApp(true);
    }
  };

  if (!showApp) {
    return <LandingPage onGetStarted={handleGetStarted} onTryDemo={handleTryDemo} />;
  }

  return (
    <AppContext.Provider value={{ appState, setAppState }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="explorer" element={<DataExplorer />} />
            <Route path="analyst" element={<AIAnalyst />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="anomalies" element={<AnomaliesPage />} />
            <Route path="decision" element={<DecisionAssistant />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
