import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#AEC5B8]/40 focus:ring-offset-0 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 shadow-2xs group';

  const variants = {
    primary: 'bg-[#1C3026] text-white hover:bg-[#14221B] active:bg-[#0D1611] shadow-2xs',
    secondary: 'bg-white border border-[#DCE7E1] text-[#1C3026] hover:bg-[#E5EDE7] hover:border-[#AEC5B8] active:bg-[#DCE7E1]',
    brand: 'bg-[#1C3026] text-white hover:bg-[#14221B] active:bg-[#0D1611] shadow-2xs',
    dark: 'bg-[#1C3026] text-white hover:bg-[#14221B] active:bg-[#0D1611]',
    outline: 'bg-white border border-[#DCE7E1] text-[#1C3026] hover:bg-[#E5EDE7] hover:border-[#AEC5B8] active:bg-[#DCE7E1]',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
    'danger-light': 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
    ghost: 'bg-transparent text-[#1C3026] hover:bg-[#E5EDE7] hover:translate-y-0 shadow-none',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs space-x-1.5',
    md: 'px-3.5 py-2 text-xs font-semibold space-x-2',
    lg: 'px-4 py-2.5 text-sm font-semibold space-x-2',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <>
          {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
