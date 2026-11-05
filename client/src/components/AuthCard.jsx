import React from 'react';
import { Layers } from 'lucide-react';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="max-w-md w-full mx-auto my-6 sm:my-10">
      <div className="bg-white rounded-2xl border border-[#DCE7E1] shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand Header & Titles */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#1C3026] text-[#AEC5B8] flex items-center justify-center mx-auto shadow-2xs">
            <Layers className="w-6 h-6 text-[#AEC5B8]" />
          </div>
          <h1 className="text-xl font-extrabold text-[#1C3026] tracking-tight font-heading">ServiceHub</h1>
          {title && <h2 className="text-2xl font-bold text-[#1C3026] tracking-tight font-heading pt-1">{title}</h2>}
          {subtitle && <p className="text-xs text-[#1C3026]/70 max-w-xs mx-auto leading-relaxed font-sans">{subtitle}</p>}
        </div>

        {/* Main Card Content */}
        <div>{children}</div>

        {/* Optional Card Footer */}
        {footer && <div className="pt-2 border-t border-[#DCE7E1]">{footer}</div>}
      </div>
    </div>
  );
}
