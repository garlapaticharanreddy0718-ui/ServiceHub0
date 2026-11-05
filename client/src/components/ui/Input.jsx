import React from 'react';

export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  required = false,
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2 bg-white border ${
            error ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
          } rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-2xs ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
    </div>
  );
}
