import { clsx } from 'clsx'
import { forwardRef, type InputHTMLAttributes } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          'min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white/90 px-3 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-subtle)] focus:border-[var(--color-accent-soft)] focus:ring-2 focus:ring-[var(--color-accent-faint)]',
          className,
        )}
        {...props}
      />
    )
  },
)
