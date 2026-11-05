import React from 'react';

export default function LoadingState({ message = 'Loading...', className = '' }) {
  return (
    <div className={`p-8 text-center space-y-5 ${className}`}>
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-600">{message}</p>
      </div>

      {/* Skeleton Card Preview */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 rounded-2xl animate-shimmer"></div>
        <div className="h-24 rounded-2xl animate-shimmer hidden sm:block"></div>
        <div className="h-24 rounded-2xl animate-shimmer hidden sm:block"></div>
      </div>
    </div>
  );
}
