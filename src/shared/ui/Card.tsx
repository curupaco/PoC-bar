import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'flat' | 'outline';
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const variantClasses = {
  default: 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-200/50 dark:shadow-none',
  glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-200/50 dark:shadow-none',
  flat: 'bg-slate-100/80 dark:bg-slate-900/50 border border-transparent',
  outline: 'bg-transparent border border-slate-200 dark:border-slate-800',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  hoverEffect = false,
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  const hoverClass = hoverEffect ? 'hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300' : 'transition-all duration-200';

  return (
    <div
      className={`rounded-2xl ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ className = '', children, ...props }) => (
  <div className={`flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/60 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ className = '', children, subtitle, icon, ...props }) => (
  <div>
    <div className="flex items-center gap-2">
      {icon && <span className="text-red-500 shrink-0">{icon}</span>}
      <h3 className={`text-base md:text-lg font-black text-slate-800 dark:text-white tracking-tight ${className}`.trim()} {...props}>
        {children}
      </h3>
    </div>
    {subtitle && (
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
    )}
  </div>
);

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({ className = '', children, ...props }) => (
  <div className={`${className}`.trim()} {...props}>
    {children}
  </div>
);

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ className = '', children, ...props }) => (
  <div className={`mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export default Card;
