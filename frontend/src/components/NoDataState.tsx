import React from 'react';
import { Database } from 'lucide-react';

export default function NoDataState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center">
        <Database className="w-10 h-10 text-blue-400" />
      </div>
      <div className="text-center">
        <p className="text-gray-900 text-xl font-semibold">No Dataset Loaded</p>
        <p className="text-gray-500 mt-2 max-w-sm">Upload a CSV or Excel file to get started, or try the demo with sample business data.</p>
      </div>
      <div className="flex gap-3">
        <p className="text-gray-400 text-sm">Use the <strong className="text-blue-600">Upload Data</strong> button in the sidebar to load your dataset.</p>
      </div>
    </div>
  );
}
