import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
}
