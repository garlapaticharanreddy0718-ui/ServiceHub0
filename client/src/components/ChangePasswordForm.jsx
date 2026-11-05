import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { KeyRound, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import AuthCard from './AuthCard';
import PasswordInput from './PasswordInput';
import Button from './ui/Button';

export default function ChangePasswordForm({ currentUser, onChangeSuccess, onLogout }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Client-side validations
    if (!formData.currentPassword) {
      setError('Please enter your current / temporary password.');
      return;
    }
    if (!formData.newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (formData.newPassword === formData.currentPassword) {
      setError('New password must be different from your temporary password.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password.');
      }

      setSuccessMsg('Password changed successfully! Redirecting to Staff Dashboard...');
      
      setTimeout(() => {
        if (onChangeSuccess) {
          onChangeSuccess(data.data?.user || { ...currentUser, mustChangePassword: false });
        }
      }, 1000);
    } catch (err) {
      setError(err.message || 'An error occurred while changing password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Change Your Password"
      subtitle="For security reasons, you must change your temporary password on your first login before accessing the Staff Portal."
    >
      <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5 text-xs text-amber-900 font-medium">
        <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <span>First login requirement: Create a strong new password that you will use for future sign-ins.</span>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-800 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-2.5 text-xs text-emerald-900 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="CURRENT / TEMPORARY PASSWORD"
          name="currentPassword"
          required
          value={formData.currentPassword}
          onChange={handleChange}
          placeholder="Enter temporary password"
          autoComplete="current-password"
        />

        <PasswordInput
          label="NEW PASSWORD"
          name="newPassword"
          required
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        <PasswordInput
          label="CONFIRM NEW PASSWORD"
          name="confirmPassword"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter new password"
          autoComplete="new-password"
        />

        <div className="pt-2 space-y-2">
          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="lg"
            disabled={loading}
            className="bg-[#123A32] hover:bg-[#173F35] text-white"
          >
            {loading ? 'Updating Password...' : 'Change Password & Proceed'}
          </Button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1.5 font-medium transition-colors"
            >
              Sign out instead
            </button>
          )}
        </div>
      </form>
    </AuthCard>
  );
}
