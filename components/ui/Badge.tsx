'use client'

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
    success: "border-transparent bg-green-500 text-white hover:bg-green-600",
    warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
    outline: "text-slate-950 border-slate-200 hover:bg-slate-100",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

