import axios from 'axios';
import type { UploadResponse, DashboardData, DataProfile, QueryResponse, Anomaly, Insight, DecisionResponse, HistoryItem } from '../types';

// In production (Vercel), VITE_API_URL = your Render backend URL
// In local dev, falls back to '/api' which Vite proxies to localhost:8000
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});


export const healthCheck = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const loadSampleData = async (): Promise<UploadResponse> => {
  const res = await api.post<UploadResponse>('/load-sample');
  return res.data;
};

export const getDataset = async () => {
  const res = await api.get('/dataset');
  return res.data;
};

export const getProfile = async (): Promise<DataProfile> => {
  const res = await api.get<DataProfile>('/profile');
  return res.data;
};

export const getDashboard = async (): Promise<DashboardData> => {
  const res = await api.get<DashboardData>('/dashboard');
  return res.data;
};

export const getInsights = async (): Promise<{insights: Insight[]; count: number}> => {
  const res = await api.get('/insights');
  return res.data;
};

export const getAnomalies = async (): Promise<{anomalies: Anomaly[]; count: number}> => {
  const res = await api.get('/anomalies');
  return res.data;
};

export const queryData = async (question: string): Promise<QueryResponse> => {
  const res = await api.post<QueryResponse>('/query', { question });
  return res.data;
};

export const makeDecision = async (question: string): Promise<DecisionResponse> => {
  const res = await api.post<DecisionResponse>('/decision', { question });
  return res.data;
};

export const getHistory = async (): Promise<{history: HistoryItem[]}> => {
  const res = await api.get('/history');
  return res.data;
};
