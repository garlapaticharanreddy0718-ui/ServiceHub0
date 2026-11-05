import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { Sparkles, ArrowRight, TrendingUp, Calendar, Users, Scissors, AlertCircle, RefreshCw } from 'lucide-react';
import LoadingState from './ui/LoadingState';

export default function OwnerOpportunities({ selectedBusiness, onNavigate }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOpportunities = useCallback(async () => {
    if (!selectedBusiness?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/owner/dashboard?businessId=${selectedBusiness.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load business growth opportunities.');
      setOpportunities(data.data?.opportunities || []);
    } catch (err) {
      console.error('Opportunities fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness?.id]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  if (loading) {
    return (
      <div className="h-80 bg-white rounded-2xl border border-[#D5E4DC] p-8 flex items-center justify-center">
        <LoadingState message="Analyzing business performance & identifying opportunities..." />
      </div>
    );
  }

  const getTargetTabLabel = (targetTab) => {
    switch (targetTab) {
      case 'services':
        return 'Manage Services';
      case 'customers':
        return 'View Customers';
      case 'staff':
      case 'team':
        return 'Manage Team';
      case 'bookings':
        return 'View Appointments';
      default:
        return 'Take Action';
    }
  };

  return (
    <div className="space-y-6 text-[#173F35] font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D5E4DC]">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h1 className="text-2xl font-black text-[#173F35] tracking-tight font-heading">
              Business Opportunities
            </h1>
          </div>
          <p className="text-xs text-[#61766F] font-medium mt-0.5">
            Rule-based operational insights to boost capacity, customer retention, and service growth.
          </p>
        </div>

        <button
          onClick={fetchOpportunities}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-white text-[#123A32] border border-[#D5E4DC] rounded-xl text-xs font-bold hover:bg-[#EEF6F1] transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Analyze Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchOpportunities} className="text-xs font-bold text-rose-700 underline">
            Retry
          </button>
        </div>
      )}

      {/* Opportunities Cards Grid */}
      {opportunities.length === 0 ? (
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-12 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-[#AEC5B8] mx-auto opacity-70" />
          <h3 className="text-sm font-extrabold text-[#173F35]">Everything is running smoothly!</h3>
          <p className="text-xs text-[#61766F] max-w-sm mx-auto">
            No critical capacity bottlenecks or inactive client alerts detected right now. Check back as new bookings come in.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white border border-[#D5E4DC] rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#AEC5B8] transition-all border-l-4 border-l-[#123A32]"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-[#123A32] tracking-wider bg-[#EEF6F1] px-2.5 py-1 rounded-full w-max border border-[#D5E4DC]">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Growth Opportunity</span>
                </div>

                <h3 className="text-base font-extrabold text-[#173F35] font-heading">{opp.title}</h3>
                <p className="text-xs text-[#61766F] leading-relaxed font-medium">{opp.explanation}</p>
              </div>

              <div className="pt-3 border-t border-[#F0F5F2] flex justify-end">
                <button
                  onClick={() => onNavigate && onNavigate(opp.targetTab || 'dashboard')}
                  className="px-4 py-2 bg-[#123A32] text-white rounded-xl text-xs font-extrabold hover:bg-[#1A4B41] transition-all flex items-center space-x-2 cursor-pointer shadow-2xs"
                >
                  <span>{getTargetTabLabel(opp.targetTab)}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
