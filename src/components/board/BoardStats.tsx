interface BoardStatsProps {
  openTaskCount: number
  memberCount: number
}

export function BoardStats({ openTaskCount, memberCount }: BoardStatsProps) {
  return (
    <section className="mb-5 shrink-0 flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-[var(--color-border)] bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]">
        Open tasks: {openTaskCount}
      </span>
      <span className="rounded-full border border-[var(--color-border)] bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]">
        Members: {memberCount}
      </span>
    </section>
  )
}
