import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  disabled,
  id,
  ...props
}, ref) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  const baseInputClasses = `w-full bg-slate-50 dark:bg-slate-950 border text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900`;
  
  const borderClass = error
    ? 'border-red-500 dark:border-red-500'
    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';

  const paddingClass = `${leftIcon ? 'pl-10' : 'px-4'} ${rightIcon ? 'pr-10' : 'px-4'} py-3.5`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`${baseInputClasses} ${borderClass} ${paddingClass} ${className}`.trim()}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 text-slate-400 dark:text-slate-500 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-[10px] font-bold text-red-500 tracking-wide">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-[10px] font-medium text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  leftIcon,
  fullWidth = true,
  className = '',
  disabled,
  id,
  children,
  ...props
}, ref) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;

  const baseSelectClasses = `w-full bg-slate-50 dark:bg-slate-950 border text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:opacity-50 appearance-none cursor-pointer`;
  
  const borderClass = error
    ? 'border-red-500 dark:border-red-500'
    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';

  const paddingClass = `${leftIcon ? 'pl-10' : 'px-4'} pr-10 py-3.5`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={selectId} className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`${baseSelectClasses} ${borderClass} ${paddingClass} ${className}`.trim()}
          {...props}
        >
          {children}
        </select>

        {/* Custom Dropdown Chevron */}
        <div className="absolute right-3.5 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error ? (
        <p className="mt-1 text-[10px] font-bold text-red-500 tracking-wide">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-[10px] font-medium text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  fullWidth = true,
  className = '',
  disabled,
  id,
  rows = 3,
  ...props
}, ref) => {
  const generatedId = React.useId();
  const textareaId = id || generatedId;

  const baseTextareaClasses = `w-full bg-slate-50 dark:bg-slate-950 border text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:opacity-50 p-4`;
  
  const borderClass = error
    ? 'border-red-500 dark:border-red-500'
    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={`${baseTextareaClasses} ${borderClass} ${className}`.trim()}
        {...props}
      />

      {error ? (
        <p className="mt-1 text-[10px] font-bold text-red-500 tracking-wide">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-[10px] font-medium text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;
