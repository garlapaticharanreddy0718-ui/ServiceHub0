import React from 'react';

export default function Select({
  label,
  error,
  options = [],
  children,
  required = false,
  className = '',
  id,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-2 bg-white border ${
          error ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
        } rounded-lg text-xs text-slate-900 focus:outline-none transition-all cursor-pointer shadow-2xs ${className}`}
        {...props}
      >
        {children
          ? children
          : options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
      </select>
      {error && <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>}
    </div>
  );
}
