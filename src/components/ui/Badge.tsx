import { clsx } from 'clsx'
import type { PropsWithChildren } from 'react'

interface BadgeProps extends PropsWithChildren {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
  className?: string
}

const toneClassName: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'border-[var(--color-border)] bg-white text-[var(--color-subtle)]',
  accent: 'border-transparent bg-[var(--color-accent-faint)] text-[var(--color-accent-strong)]',
  success: 'border-transparent bg-emerald-100 text-emerald-700',
  warning: 'border-transparent bg-amber-100 text-amber-700',
  danger: 'border-transparent bg-rose-100 text-rose-700',
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
        toneClassName[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
