import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className = '',
}) {
  return (
    <div className={`p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center space-y-3 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-100/80 text-slate-500 flex items-center justify-center mb-1">
          <Icon className="w-6 h-6 text-slate-600" />
        </div>
      )}
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      {description && <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button onClick={onAction} icon={ActionIcon}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
