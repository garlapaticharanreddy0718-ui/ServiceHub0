import React from 'react';

export default function Badge({ children, variant = 'slate', size = 'md', className = '' }) {
  const variants = {
    // Status variants
    PENDING: 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/30 font-semibold',
    CONFIRMED: 'bg-[#D1FAE5] text-[#047857] border-[#059669]/30 font-semibold',
    IN_PROGRESS: 'bg-[#EFF6FF] text-[#2563EB] border-[#3B82F6]/30 font-semibold',
    COMPLETED: 'bg-[#D1FAE5] text-[#065F46] border-[#059669]/30 font-semibold',
    CANCELLED: 'bg-rose-50 text-rose-800 border-rose-200 font-semibold',
    NO_SHOW: 'bg-[#F3F4F6] text-[#102A43] border-[#D1D5DB] font-semibold',
    
    // Role variants
    OWNER: 'bg-[#EFF6FF] text-[#2563EB] border-[#3B82F6]/30 font-semibold',
    ADMIN: 'bg-[#D1FAE5] text-[#047857] border-[#059669]/30 font-semibold',
    STAFF: 'bg-[#D1FAE5] text-[#047857] border-[#059669]/30 font-semibold',
    CUSTOMER: 'bg-[#F3F4F6] text-[#102A43] border-[#D1D5DB] font-semibold',

    // Generic color variants
    slate: 'bg-[#F3F4F6] text-[#102A43] border-[#D1D5DB]',
    emerald: 'bg-[#D1FAE5] text-[#047857] border-[#059669]/30',
    indigo: 'bg-[#D1FAE5] text-[#047857] border-[#059669]/30',
    blue: 'bg-[#EFF6FF] text-[#2563EB] border-[#3B82F6]/30',
    amber: 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/30',
    red: 'bg-rose-50 text-rose-800 border-rose-200',
    sky: 'bg-[#EFF6FF] text-[#2563EB] border-[#3B82F6]/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-[11px] font-semibold',
    lg: 'px-3 py-1 text-xs font-bold',
  };

  const styleClass = variants[variant] || variants.slate;

  return (
    <span className={`inline-flex items-center rounded-md border ${styleClass} ${sizes[size] || sizes.md} ${className}`}>
      {children}
    </span>
  );
}
