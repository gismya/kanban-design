import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { clsx } from 'clsx'
import { useMemo } from 'react'
import type { Task, TaskStatus, User } from '../../types/domain'
import { getColumnId } from './boardDnd'
import { QuickAddTask } from './QuickAddTask'
import { TaskCard } from './TaskCard'

interface KanbanColumnProps {
  status: TaskStatus
  title: string
  tasks: Task[]
  members: User[]
  onTaskClick: (taskId: string) => void
  onQuickAdd: (status: TaskStatus, title: string) => Promise<void>
}

export function KanbanColumn({ status, title, tasks, members, onTaskClick, onQuickAdd }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnId(status),
    data: {
      type: 'column',
      status,
    },
  })
  const membersById = useMemo(() => new Map(members.map((member) => [member.userId, member])), [members])

  return (
    <section
      ref={setNodeRef}
      className={clsx(
        'flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition',
        isOver && 'border-[var(--color-accent-soft)] bg-white',
      )}
      data-testid={`column-${status}`}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg">{title}</h3>
        <span className="rounded-full bg-[var(--color-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--color-subtle)]">
          {tasks.length}
        </span>
      </header>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pr-1">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignee={task.assigneeId ? membersById.get(task.assigneeId) : undefined}
                onClick={onTaskClick}
              />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-white/70 px-3 py-4 text-center text-xs text-[var(--color-subtle)]">
              No tasks yet. Add one below.
            </p>
          )}
        </div>
      </SortableContext>

      <QuickAddTask statusLabel={title} onAdd={(titleValue) => onQuickAdd(status, titleValue)} />
    </section>
  )
}
