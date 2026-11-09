import type { ReactNode } from 'react';

export const inputClass =
  'w-full border border-ink/50 bg-warm-white px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none';

/** Label + control + hint/error wrapper used by the admin forms. */
export default function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink-soft">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-maroon">
          {error}
        </p>
      ) : null}
    </div>
  );
}
