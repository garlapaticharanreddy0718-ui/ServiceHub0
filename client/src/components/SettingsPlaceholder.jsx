import React from 'react';
import PageHeader from './ui/PageHeader';
import { Settings, Building2, Shield, Bell, Lock } from 'lucide-react';
import Button from './ui/Button';

export default function SettingsPlaceholder({ selectedBusiness, currentUser }) {
  const role = selectedBusiness?.currentUserRole || 'STAFF';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Settings"
        subtitle={`Configure workspace preferences and operational details for ${selectedBusiness?.name}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* General Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 tracking-tight">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Business Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-0.5">Business Name</span>
                <span className="font-bold text-slate-900">{selectedBusiness?.name}</span>
              </div>
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-0.5">Category</span>
                <span className="font-semibold text-slate-900">{selectedBusiness?.category || 'General Service'}</span>
              </div>
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-0.5">Phone Contact</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedBusiness?.phone || 'Not provided'}</span>
              </div>
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block mb-0.5">Location</span>
                <span className="font-semibold text-slate-900">{selectedBusiness?.city || selectedBusiness?.address || 'Unspecified'}</span>
              </div>
            </div>
          </div>

          {/* RBAC Notice */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 tracking-tight">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Access & Role Governance</span>
            </h3>
            <p className="text-xs text-slate-600">
              Your current access role for this business is <strong className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{role}</strong>.
            </p>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4 h-fit">
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">Workspace Quick Info</h4>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Tenant ID</span>
              <span className="font-mono text-[11px] font-semibold text-slate-800">{selectedBusiness?.id?.substring(0, 8)}...</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Account User</span>
              <span className="font-bold text-slate-900">{currentUser?.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
