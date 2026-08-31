import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonRounded = 'lg' | 'xl' | '2xl' | '3xl' | 'full';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 active:bg-red-800',
  secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100',
  dark: 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-md',
  outline: 'border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 bg-transparent',
  ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 active:bg-red-800',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 active:bg-emerald-800',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
  sm: 'px-3.5 py-2 text-xs font-black uppercase tracking-wider',
  md: 'px-5 py-3 text-xs font-black uppercase tracking-widest',
  lg: 'px-7 py-4 text-xs font-black uppercase tracking-widest',
  xl: 'px-8 py-5 text-sm font-black uppercase tracking-widest',
};

const roundedStyles: Record<ButtonRounded, string> = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  rounded = '2xl',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  const baseClasses = `inline-flex items-center justify-center font-black transition-all duration-200 select-none focus-visible:outline-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100`;
  const widthClass = fullWidth ? 'w-full' : '';
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];
  const roundedClass = roundedStyles[rounded];

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${roundedClass} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </span>
      )}
    </button>
  );
};

export default Button;
