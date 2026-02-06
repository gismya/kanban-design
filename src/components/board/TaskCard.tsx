import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { clsx } from 'clsx'
import type { Task, TaskPriority, User } from '../../types/domain'
import { Badge } from '../ui/Badge'

interface TaskCardProps {
  task: Task
  assignee?: User
  onClick: (taskId: string) => void
}

const priorityTone: Record<TaskPriority, 'neutral' | 'warning' | 'danger' | 'accent'> = {
  low: 'neutral',
  medium: 'accent',
  high: 'warning',
  urgent: 'danger',
}

interface TaskCardBodyProps {
  task: Task
  assignee?: User
}

function TaskCardBody({ task, assignee }: TaskCardBodyProps) {
  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-semibold text-[var(--color-ink)]">{task.title}</h4>
        <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
      </div>

      {task.description ? (
        <p className="line-clamp-2 text-xs text-[var(--color-subtle)]">{task.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {task.tags.map((tag) => (
          <Badge key={tag} tone="neutral">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-subtle)]">
        <span>{task.dueDate ? `Due ${task.dueDate}` : 'No due date'}</span>
        {assignee ? (
          <span className="inline-flex items-center gap-2">
            <img
              src={assignee.avatarUrl}
              alt={assignee.name}
              className="h-6 w-6 rounded-full object-cover ring-1 ring-[var(--color-border)]"
            />
            <span className="line-clamp-1 max-w-24">{assignee.name}</span>
          </span>
        ) : null}
      </div>
    </>
  )
}

export function TaskCard({ task, assignee, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      status: task.status,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        'group rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[0_4px_16px_rgba(17,24,39,0.08)] transition-[border-color,box-shadow,opacity] duration-200 hover:border-[var(--color-accent-soft)] hover:shadow-[0_10px_26px_rgba(17,24,39,0.12)] will-change-transform',
        isDragging && 'opacity-25 shadow-[0_18px_30px_rgba(17,24,39,0.18)]',
      )}
      data-testid={`task-card-${task.id}`}
    >
      <button
        type="button"
        className="w-full cursor-grab touch-none text-left active:cursor-grabbing"
        onClick={() => onClick(task.id)}
        {...attributes}
        {...listeners}
      >
        <TaskCardBody task={task} assignee={assignee} />
      </button>
    </article>
  )
}

interface TaskCardPreviewProps {
  task: Task
  assignee?: User
}

export function TaskCardPreview({ task, assignee }: TaskCardPreviewProps) {
  return (
    <article className="w-[288px] rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[0_18px_30px_rgba(17,24,39,0.2)]">
      <TaskCardBody task={task} assignee={assignee} />
    </article>
  )
}
