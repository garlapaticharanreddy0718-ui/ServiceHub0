import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { Star, MessageSquare, Filter, AlertCircle, RefreshCw, User, Scissors } from 'lucide-react';
import LoadingState from './ui/LoadingState';

export default function OwnerReviews({ selectedBusiness }) {
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starFilter, setStarFilter] = useState('ALL');

  const fetchReviews = useCallback(async () => {
    if (!selectedBusiness?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/businesses/${selectedBusiness.id}/reviews`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch customer reviews.');

      setReviewsData(data.data);
    } catch (err) {
      console.error('Fetch reviews error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loading) {
    return (
      <div className="h-80 bg-white rounded-2xl border border-[#D5E4DC] p-8 flex items-center justify-center">
        <LoadingState message="Loading customer reviews..." />
      </div>
    );
  }

  const { totalReviews = 0, avgRating = 0, ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, reviews = [] } =
    reviewsData || {};

  const filteredReviews =
    starFilter === 'ALL'
      ? reviews
      : reviews.filter((r) => r.rating === Number(starFilter));

  return (
    <div className="space-y-6 text-[#173F35] font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D5E4DC]">
        <div>
          <h1 className="text-2xl font-black text-[#173F35] tracking-tight font-heading">
            Customer Reviews
          </h1>
          <p className="text-xs text-[#61766F] font-medium mt-0.5">
            Monitor client feedback, satisfaction ratings, and service testimonials.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-white text-[#123A32] border border-[#D5E4DC] rounded-xl text-xs font-bold hover:bg-[#EEF6F1] transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchReviews} className="text-xs font-bold text-rose-700 underline">
            Retry
          </button>
        </div>
      )}

      {/* Summary Ratings & Distribution Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rating Score Card */}
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-6 shadow-2xs flex flex-col justify-center items-center text-center space-y-2">
          <span className="text-4xl font-black text-[#173F35] font-heading">{avgRating > 0 ? avgRating : '0.0'}</span>
          <div className="flex items-center space-x-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
              />
            ))}
          </div>
          <p className="text-xs text-[#61766F] font-bold">
            Based on {totalReviews} verified customer {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* Rating Distribution Breakdown */}
        <div className="md:col-span-2 bg-white border border-[#D5E4DC] rounded-2xl p-6 shadow-2xs space-y-2.5 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0;
            const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

            return (
              <div key={star} className="flex items-center space-x-3 text-xs font-bold">
                <span className="w-12 text-[#173F35] flex items-center space-x-1">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-3 bg-[#EEF6F1] rounded-full overflow-hidden border border-[#D5E4DC]/60">
                  <div
                    className="h-full bg-[#123A32] rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-12 text-right text-[#61766F]">{count} ({percent}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 pt-2">
        <Filter className="w-4 h-4 text-[#61766F]" />
        <span className="text-xs font-bold text-[#173F35]">Filter by Rating:</span>
        <div className="flex flex-wrap gap-1.5">
          {['ALL', '5', '4', '3', '2', '1'].map((star) => (
            <button
              key={star}
              onClick={() => setStarFilter(star)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                starFilter === star
                  ? 'bg-[#123A32] text-white border-[#123A32]'
                  : 'bg-white text-[#61766F] border-[#D5E4DC] hover:bg-[#EEF6F1]'
              }`}
            >
              {star === 'ALL' ? 'All Reviews' : `${star} Stars`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white border border-[#D5E4DC] rounded-2xl p-12 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-[#AEC5B8] mx-auto opacity-70" />
          <h3 className="text-sm font-extrabold text-[#173F35]">No reviews yet</h3>
          <p className="text-xs text-[#61766F] max-w-sm mx-auto">
            {starFilter === 'ALL'
              ? 'When clients complete appointments and submit ratings, their reviews will appear here.'
              : `No reviews matching ${starFilter} stars.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-[#D5E4DC] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between hover:border-[#AEC5B8] transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#123A32] text-white flex items-center justify-center text-xs font-black">
                      {(rev.customer?.name || 'C').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#173F35]">
                        {rev.customer?.name || 'Verified Client'}
                      </h4>
                      <p className="text-[10px] text-[#61766F] font-bold">
                        Service: {rev.booking?.service?.name || 'General Service'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating ? 'fill-amber-400' : 'text-slate-200 fill-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-xs text-[#2D453E] leading-relaxed italic bg-[#F7FAFA] p-3 rounded-xl border border-[#E6EFEA]">
                    "{rev.comment}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[#F0F5F2] flex items-center justify-between text-[11px] font-bold text-[#61766F]">
                <span>Staff: {rev.booking?.staff?.displayName || rev.booking?.staff?.businessMember?.user?.name || 'Specialist'}</span>
                <span>{new Date(rev.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
