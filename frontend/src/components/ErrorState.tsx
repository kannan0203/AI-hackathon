import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-gray-700 text-lg font-medium">Something went wrong</p>
      <p className="text-gray-500 text-center max-w-md">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-2">Try Again</button>
      )}
    </div>
  );
}
