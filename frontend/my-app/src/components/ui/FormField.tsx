import React from 'react';

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, hint, required, className = '', children }) => (
  <div className={`flex flex-col gap-1.5 mb-4 ${className}`}>
    {label && (
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {error && <span className="text-xs text-rose-600 font-medium">⚠ {error}</span>}
    {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
  </div>
);

