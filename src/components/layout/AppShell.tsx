import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/Button'

interface AppShellProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  boardProjectId?: string | null
  onLogout: () => Promise<void>
  children: ReactNode
}

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`rounded-full px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-[var(--color-accent-faint)] text-[var(--color-accent-strong)]'
          : 'text-[var(--color-subtle)] hover:text-[var(--color-ink)]'
      }`}
    >
      {label}
    </Link>
  )
}

export function AppShell({ title, subtitle, actions, boardProjectId, onLogout, children }: AppShellProps) {
  const location = useLocation()
  const [isMobileHeaderCollapsed, setIsMobileHeaderCollapsed] = useState(true)

  return (
    <>
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-24 top-12 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(17,153,142,0.25),transparent_65%)] blur-2xl" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.2),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] max-w-[1500px] flex-col">
        <header className="mx-4 mb-6 mt-6 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.06)] backdrop-blur sm:mx-6 lg:mx-10 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl leading-tight md:text-3xl">{title}</h1>
              {subtitle ? (
                <p className={`${isMobileHeaderCollapsed ? 'hidden md:block' : 'block'} mt-1 text-sm text-[var(--color-subtle)]`}>
                  {subtitle}
                </p>
              ) : null}
            </div>

            <Button
              variant="ghost"
              className="min-h-0 rounded-lg px-3 py-1 text-xs md:hidden"
              type="button"
              aria-controls="app-shell-header-panel"
              aria-expanded={!isMobileHeaderCollapsed}
              onClick={() => setIsMobileHeaderCollapsed((collapsed) => !collapsed)}
            >
              {isMobileHeaderCollapsed ? 'Show header' : 'Hide header'}
            </Button>
            <div
              id="app-shell-header-panel"
              className={`${isMobileHeaderCollapsed ? 'hidden md:flex' : 'flex'} w-full flex-col items-start gap-2 md:w-auto md:min-w-fit md:items-end`}
            >
              <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                <NavLink to="/projects" label="Projects" active={location.pathname.startsWith('/projects')} />
                {boardProjectId ? (
                  <NavLink
                    to={`/board/${boardProjectId}`}
                    label="Board"
                    active={location.pathname.startsWith('/board')}
                  />
                ) : (
                  <span className="rounded-full px-3 py-2 text-sm font-medium text-[var(--color-subtle)]/60">
                    Board
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                {actions}
                <Button variant="secondary" onClick={() => void onLogout()}>
                  Log out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6 lg:px-10">{children}</main>
      </div>
    </>
  )
}
