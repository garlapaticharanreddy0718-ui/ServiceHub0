import React, { useState } from 'react';
import { apiRequest, setAccessToken } from '../services/api';
import { Mail, AlertCircle, Sparkles } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import PasswordInput from './PasswordInput';
import RoleSelector from './RoleSelector';
import AuthCard from './AuthCard';

export default function LoginForm({ onLoginSuccess, switchToRegister, initialRole = 'customer', externalError = null }) {
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roleSubtitles = {
    customer: 'Sign in to your ServiceHub customer account',
    staff: 'Sign in to your ServiceHub staff account',
    owner: 'Sign in to your ServiceHub owner account',
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleQuickFillDemo = (role, email, password) => {
    setSelectedRole(role);
    setFormData({ email, password });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      setAccessToken(data.data.accessToken);
      if (onLoginSuccess) {
        await onLoginSuccess(data.data.user, selectedRole);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  const activeError = error || externalError;

  return (
    <AuthCard
      title="Welcome back"
      subtitle={roleSubtitles[selectedRole]}
    >
      <RoleSelector
        selectedRole={selectedRole}
        onSelectRole={handleRoleChange}
        mode="login"
      />

      {activeError && (
        <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{activeError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="EMAIL ADDRESS"
          type="email"
          name="email"
          required
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          placeholder="user@example.com"
          autoComplete="email"
        />

        <PasswordInput
          label="PASSWORD"
          name="password"
          required
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <div className="pt-2">
          <Button
            type="submit"
            fullWidth
            loading={loading}
            size="lg"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>
      </form>

      {/* Development / Demo Mode Quick-Fill Buttons */}
      {import.meta.env.DEV && (
        <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
          <div className="flex items-center justify-center space-x-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-sky-500" />
            <span>Demo Accounts</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={() => handleQuickFillDemo('customer', 'demo.customer@servicehub.local', 'DemoCustomer123!')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFillDemo('staff', 'demo.staff@servicehub.local', 'DemoStaff123!')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              Demo Staff
            </button>
            <button
              type="button"
              onClick={() => handleQuickFillDemo('owner', 'demo.owner@servicehub.local', 'DemoOwner123!')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200/80 transition-colors"
            >
              Demo Owner
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => switchToRegister && switchToRegister(selectedRole)}
          className="text-sky-600 hover:underline font-semibold"
        >
          Create one
        </button>
      </div>
    </AuthCard>
  );
}
