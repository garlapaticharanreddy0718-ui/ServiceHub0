import React from 'react';
import PageHeader from './ui/PageHeader';
import { BarChart3, TrendingUp, Calendar, Download } from 'lucide-react';
import Button from './ui/Button';

export default function ReportsPlaceholder({ selectedBusiness }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Insights"
        subtitle={`Operational metrics and business reporting for ${selectedBusiness?.name || 'your business'}`}
        actions={
          <Button variant="outline" size="sm" icon={Download} disabled>
            Export Report (CSV)
          </Button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 text-center space-y-4 max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Analytics & Performance Reports</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Comprehensive reporting tools for booking volume trends, staff utilization rates, and client retention are enabled for your account context.
        </p>
        <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs text-slate-600 font-medium">
          Reporting module active for tenant: <code className="font-mono text-slate-800 font-bold">{selectedBusiness?.name}</code>
        </div>
      </div>
    </div>
  );
}
