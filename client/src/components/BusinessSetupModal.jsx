import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { Sparkles, Scissors, Users, Clock, CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';

export default function BusinessSetupModal({ business, initialSetupStatus, onNavigate, onClose }) {
  const [setupStatus, setSetupStatus] = useState(initialSetupStatus || null);
  const [loading, setLoading] = useState(!initialSetupStatus);

  const fetchStatus = useCallback(async () => {
    if (!business?.id) return;
    try {
      const res = await apiRequest(`/owner/setup-status?businessId=${business.id}`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setSetupStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch setup status:', err);
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const steps = setupStatus?.steps || {
    services: { complete: false, count: 0 },
    team: { complete: false, count: 0 },
    availability: { complete: false },
  };

  const isSetupComplete = setupStatus?.isSetupComplete || false;

  const completedCount = [
    steps.services?.complete,
    steps.team?.complete,
    steps.availability?.complete,
  ].filter(Boolean).length;

  const handleContinueSetup = () => {
    if (!steps.services?.complete) {
      onNavigate('services');
    } else if (!steps.team?.complete) {
      onNavigate('team');
    } else {
      onNavigate('team');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#EEF6F1] p-4 font-sans text-[#102C26] overflow-y-auto">
      {/* Background Subtle Ambient Glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#0B8F6A]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#CBDCD3] shadow-[0_20px_50px_rgba(16,44,38,0.12)] p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#52665F] hover:text-[#102C26] hover:bg-[#EAEFEA] rounded-full transition-colors cursor-pointer"
          title="Close guidance"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-[#DFF2E9] text-[#0B8F6A] flex items-center justify-center mx-auto shadow-2xs border border-[#0B8F6A]/20">
            <Sparkles className="w-7 h-7 text-[#0B8F6A]" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-[#0B8F6A] uppercase tracking-wider bg-[#DFF2E9] px-3 py-1 rounded-full border border-[#0B8F6A]/20">
              New Business Created
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#102C26] font-heading tracking-tight pt-1">
              Business created successfully!
            </h2>
            <p className="text-sm font-extrabold text-[#1D4439] font-heading">
              <strong className="text-[#0B8F6A] font-black">{business?.name || 'Your Business'}</strong> is now ready to set up.
            </p>
          </div>

          <p className="text-xs text-[#52665F] max-w-md mx-auto leading-relaxed font-medium">
            Let's set up a few essentials to start accepting appointments.
          </p>
        </div>

        {/* Progress Summary Bar */}
        <div className="p-3.5 bg-[#F4F8F5] border border-[#D3E0D9] rounded-2xl flex items-center justify-between text-xs">
          <span className="font-bold text-[#102C26] font-heading">
            Setup Progress: <strong className="text-[#0B8F6A]">{completedCount} of 3</strong> steps completed
          </span>
          <div className="flex space-x-1.5">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-6 h-2 rounded-full transition-all ${
                  idx <= completedCount ? 'bg-[#0B8F6A]' : 'bg-[#D3E0D9]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 3 Interactive Setup Steps */}
        <div className="space-y-3">
          {/* Step 1: Add Services */}
          <div
            onClick={() => onNavigate('services')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              steps.services?.complete
                ? 'bg-[#F4F9F6] border-[#0B8F6A]/30 text-[#102C26]'
                : 'bg-white border-[#D3E0D9] hover:border-[#0B8F6A] hover:shadow-2xs'
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  steps.services?.complete ? 'bg-[#0B8F6A] text-white' : 'bg-[#E2ECE7] text-[#1D4439]'
                }`}
              >
                <Scissors className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-[#102C26] font-heading">1. Add Your Services</h4>
                  {steps.services?.complete && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#DFF2E9] text-[#0B8F6A] rounded-full">
                      Added ({steps.services?.count || 1})
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#52665F]">Create your services, prices and durations.</p>
              </div>
            </div>

            {steps.services?.complete ? (
              <CheckCircle2 className="w-6 h-6 text-[#0B8F6A] flex-shrink-0" />
            ) : (
              <Circle className="w-6 h-6 text-[#AEC5B8] flex-shrink-0" />
            )}
          </div>

          {/* Step 2: Add Team */}
          <div
            onClick={() => onNavigate('team')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              steps.team?.complete
                ? 'bg-[#F4F9F6] border-[#0B8F6A]/30 text-[#102C26]'
                : 'bg-white border-[#D3E0D9] hover:border-[#0B8F6A] hover:shadow-2xs'
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  steps.team?.complete ? 'bg-[#0B8F6A] text-white' : 'bg-[#E2ECE7] text-[#1D4439]'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-[#102C26] font-heading">2. Add Your Team</h4>
                  {steps.team?.complete && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#DFF2E9] text-[#0B8F6A] rounded-full">
                      Added ({steps.team?.count || 1})
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#52665F]">Add your staff members and assign their services.</p>
              </div>
            </div>

            {steps.team?.complete ? (
              <CheckCircle2 className="w-6 h-6 text-[#0B8F6A] flex-shrink-0" />
            ) : (
              <Circle className="w-6 h-6 text-[#AEC5B8] flex-shrink-0" />
            )}
          </div>

          {/* Step 3: Set Availability */}
          <div
            onClick={() => onNavigate('team')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              steps.availability?.complete
                ? 'bg-[#F4F9F6] border-[#0B8F6A]/30 text-[#102C26]'
                : 'bg-white border-[#D3E0D9] hover:border-[#0B8F6A] hover:shadow-2xs'
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  steps.availability?.complete ? 'bg-[#0B8F6A] text-white' : 'bg-[#E2ECE7] text-[#1D4439]'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-[#102C26] font-heading">3. Set Staff Availability</h4>
                  {steps.availability?.complete && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#DFF2E9] text-[#0B8F6A] rounded-full">
                      Configured
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#52665F]">Configure working hours, breaks and time off.</p>
              </div>
            </div>

            {steps.availability?.complete ? (
              <CheckCircle2 className="w-6 h-6 text-[#0B8F6A] flex-shrink-0" />
            ) : (
              <Circle className="w-6 h-6 text-[#AEC5B8] flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-2">
          {isSetupComplete ? (
            <div className="space-y-3 text-center">
              <div className="p-3 bg-[#DFF2E9] text-[#0B8F6A] rounded-2xl text-xs font-bold font-heading border border-[#0B8F6A]/30">
                🎉 Your business setup is complete! You are ready to accept appointments.
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-[#1D4439] hover:bg-[#102C26] text-white font-extrabold text-sm rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 text-xs font-bold text-[#52665F] hover:text-[#102C26] hover:bg-[#EAEFEA] rounded-2xl transition-all cursor-pointer"
              >
                Maybe Later
              </button>

              <button
                type="button"
                onClick={handleContinueSetup}
                className="px-6 py-3 bg-[#1D4439] hover:bg-[#102C26] text-white font-extrabold text-xs rounded-2xl shadow-xs transition-all cursor-pointer flex items-center space-x-2"
              >
                <span>Continue Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
