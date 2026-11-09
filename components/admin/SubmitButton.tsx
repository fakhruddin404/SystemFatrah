'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

const VARIANTS = {
  primary: 'bg-maroon text-warm-white border-maroon hover:bg-maroon-deep',
  outline: 'bg-transparent text-ink border-ink hover:bg-ink hover:text-warm-white',
  danger: 'bg-transparent text-maroon border-maroon hover:bg-maroon hover:text-warm-white',
} as const;

/** Submit button that disables itself while its form action is running. */
export default function SubmitButton({
  children,
  variant = 'primary',
  className = '',
  confirmMessage,
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
  /** Shows a browser confirm dialog before submitting (for destructive actions). */
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
      className={`inline-flex items-center justify-center border px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {pending ? 'Working…' : children}
    </button>
  );
}
