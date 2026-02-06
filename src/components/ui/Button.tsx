import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: ButtonVariant
}

const baseClassName =
  'inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50'

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white shadow-[0_8px_24px_rgba(20,120,120,0.28)] hover:bg-[var(--color-accent-strong)]',
  secondary:
    'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent-soft)] hover:bg-[var(--color-bg)]',
  ghost:
    'bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-muted)]',
  danger: 'bg-[var(--color-coral)] text-white hover:opacity-90',
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button className={clsx(baseClassName, variantClassName[variant], className)} {...props}>
      {children}
    </button>
  )
}
