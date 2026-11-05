import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  label = 'Password',
  name = 'password',
  value,
  onChange,
  required = false,
  placeholder = '••••••••',
  error,
  helperText,
  minLength,
  id,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name || 'password';

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Lock className="w-4 h-4" />
        </div>
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          className={`w-full pl-9 pr-10 py-2 bg-slate-50 border ${
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-slate-500 focus:border-slate-500'
          } rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 transition-all ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4 text-sky-600" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
    </div>
  );
}
