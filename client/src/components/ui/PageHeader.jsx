import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  actions,
  children,
  className = '',
}) {
  return (
    <div className={`mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 ${className}`}>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center space-x-2.5 flex-shrink-0">{actions}</div>}
      {children}
    </div>
  );
}
