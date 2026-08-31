import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  success: {
    container: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  warning: {
    container: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-500',
  },
  danger: {
    container: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    dot: 'bg-red-500',
  },
  info: {
    container: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    dot: 'bg-blue-500',
  },
  neutral: {
    container: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
    dot: 'bg-slate-500',
  },
  primary: {
    container: 'bg-red-600 text-white shadow-sm shadow-red-600/30',
    dot: 'bg-white',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[9px] px-2 py-0.5 font-black uppercase tracking-wider',
  md: 'text-[10px] px-2.5 py-1 font-black uppercase tracking-wider',
  lg: 'text-xs px-3 py-1.5 font-black uppercase tracking-widest',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...props
}) => {
  const variantConfig = variantStyles[variant];
  const sizeClass = sizeStyles[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full select-none ${variantConfig.container} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${variantConfig.dot}`} />}
      {children}
    </span>
  );
};

export default Badge;
