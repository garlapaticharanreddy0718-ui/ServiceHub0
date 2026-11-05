import React, { useState } from 'react';
import { apiRequest, setAccessToken } from '../services/api';
import { User, Mail, Phone, AlertCircle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import PasswordInput from './PasswordInput';
import RoleSelector from './RoleSelector';
import AuthCard from './AuthCard';

export default function RegisterForm({ onRegisterSuccess, switchToLogin, initialRole = 'customer' }) {
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const roleSubtitles = {
    customer: 'Create an account to book & manage your appointments',
    staff: 'Staff accounts are created or invited by a business owner',
    owner: 'Create an account to register & manage your business',
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedRole === 'staff') {
      // Staff self-registration is prevented to protect business integrity
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      const createdUser = data.data.user;

      // Automatically authenticate the newly registered user
      try {
        const loginRes = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          setAccessToken(loginData.data.accessToken);
          if (onRegisterSuccess) {
            onRegisterSuccess(loginData.data.user || createdUser, selectedRole);
            return;
          }
        }
      } catch (loginErr) {
        console.error('Auto-login post registration failed:', loginErr);
      }

      setSuccessMsg('Account created successfully! You can now sign in.');
      if (onRegisterSuccess) {
        onRegisterSuccess(createdUser, selectedRole);
      }
    } catch (err) {
      setError(err.message || 'Unable to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your ServiceHub account"
      subtitle={roleSubtitles[selectedRole]}
    >
      <RoleSelector
        selectedRole={selectedRole}
        onSelectRole={handleRoleChange}
        mode="register"
      />

      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-900 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{successMsg}</p>
            <button
              type="button"
              onClick={() => switchToLogin && switchToLogin(selectedRole)}
              className="mt-1 text-xs font-semibold text-emerald-800 underline hover:text-emerald-950"
            >
              Sign In Now →
            </button>
          </div>
        </div>
      )}

      {selectedRole === 'staff' ? (
        /* Controlled Staff Registration Onboarding Notice */
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-center">
          <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Staff Account Notice</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Staff accounts are created or invited directly by a business owner.
              Please contact your business administrator for an invitation, or sign in if you already have account credentials.
            </p>
          </div>
          <Button
            fullWidth
            onClick={() => switchToLogin && switchToLogin('staff')}
            icon={ArrowRight}
          >
            Sign In as Staff
          </Button>
        </div>
      ) : (
        /* Customer & Owner Self-Registration Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="FULL NAME"
            type="text"
            name="name"
            required
            icon={User}
            value={formData.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            autoComplete="name"
          />

          <Input
            label="EMAIL ADDRESS"
            type="email"
            name="email"
            required
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            placeholder="jane@example.com"
            autoComplete="email"
          />

          <Input
            label="PHONE NUMBER (OPTIONAL)"
            type="tel"
            name="phone"
            icon={Phone}
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            autoComplete="tel"
          />

          <PasswordInput
            label="PASSWORD"
            name="password"
            required
            minLength={6}
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            helperText="Minimum 6 characters"
            autoComplete="new-password"
          />

          <PasswordInput
            label="CONFIRM PASSWORD"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="new-password"
          />

          <div className="pt-2">
            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="lg"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => switchToLogin && switchToLogin(selectedRole)}
          className="text-sky-600 hover:underline font-semibold"
        >
          Sign in instead
        </button>
      </div>
    </AuthCard>
  );
}
