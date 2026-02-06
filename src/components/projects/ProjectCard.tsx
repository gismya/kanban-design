import type { Project } from '../../types/domain'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface ProjectCardProps {
  project: Project
  onOpen: (projectId: string) => void
}

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const openCount = project.taskCounts.todo + project.taskCounts.in_progress + project.taskCounts.review

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_8px_26px_rgba(17,24,39,0.08)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(17,24,39,0.14)]">
      <div
        className="absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-20 blur-xl"
        style={{ backgroundColor: project.themeColor }}
      />

      <div className="relative space-y-4">
        <div>
          <h3 className="font-display text-xl">{project.name}</h3>
          <p className="mt-2 text-sm text-[var(--color-subtle)]">{project.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">Open {openCount}</Badge>
          <Badge tone="neutral">Done {project.taskCounts.done}</Badge>
          {project.recentActivity ? <Badge tone="neutral">{project.recentActivity}</Badge> : null}
        </div>

        <Button className="w-full" onClick={() => onOpen(project.id)}>
          Open Board
        </Button>
      </div>
    </article>
  )
}
