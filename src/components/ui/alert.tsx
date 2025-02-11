// src/components/ui/alert.tsx
import React from 'react';

interface AlertProps {
  variant?: 'default' | 'destructive';
  className?: string;
  children: React.ReactNode;
}

interface AlertTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function Alert({ 
  variant = 'default', 
  className = '', 
  children 
}: AlertProps) {
  const baseStyles = "relative w-full rounded-lg border p-4 my-2";
  const variantStyles = {
    default: "bg-gray-50 border-gray-200 text-gray-900",
    destructive: "bg-red-50 border-red-200 text-red-900"
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function AlertTitle({ 
  className = '', 
  children 
}: AlertTitleProps) {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
}

export function AlertDescription({ 
  className = '', 
  children 
}: AlertDescriptionProps) {
  return (
    <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
      {children}
    </div>
  );
}