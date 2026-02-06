import { useEffect, useMemo, useState } from 'react'
import {
  type CreateTaskInput,
  DEFAULT_TASK_PRIORITY,
  type ProjectLane,
  TASK_PRIORITIES,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskInput,
  type User,
} from '../../types/domain'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface TaskModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  projectId: string
  defaultStatus?: TaskStatus
  lanes: ProjectLane[]
  members: User[]
  task?: Task
  onClose: () => void
  onCreate: (input: CreateTaskInput) => Promise<void>
  onUpdate: (input: UpdateTaskInput) => Promise<void>
}

interface TaskFormState {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string
  dueDate: string
  tags: string
  estimatePoints: string
}

const priorityOptions: TaskPriority[] = [...TASK_PRIORITIES]

export function TaskModal({
  isOpen,
  mode,
  projectId,
  defaultStatus = 'todo',
  lanes,
  members,
  task,
  onClose,
  onCreate,
  onUpdate,
}: TaskModalProps) {
  const [state, setState] = useState<TaskFormState>({
    title: '',
    description: '',
    status: defaultStatus,
    priority: DEFAULT_TASK_PRIORITY,
    assigneeId: members[0]?.userId ?? '',
    dueDate: '',
    tags: '',
    estimatePoints: '1',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentAssignee = useMemo(() => members[0]?.userId ?? '', [members])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (mode === 'edit' && task) {
      setState({
        title: task.title,
        description: task.description,
        status: lanes.some((lane) => lane.id === task.status) ? task.status : defaultStatus,
        priority: task.priority,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate ?? '',
        tags: task.tags.join(', '),
        estimatePoints: String(task.estimatePoints),
      })
    } else {
      setState({
        title: '',
        description: '',
        status: lanes.some((lane) => lane.id === defaultStatus) ? defaultStatus : lanes[0]?.id ?? 'backlog',
        priority: DEFAULT_TASK_PRIORITY,
        assigneeId: currentAssignee,
        dueDate: '',
        tags: '',
        estimatePoints: '1',
      })
    }

    setError(null)
  }, [currentAssignee, defaultStatus, isOpen, lanes, mode, task])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) {
    return null
  }

  const submit = async () => {
    const title = state.title.trim()
    if (!title) {
      setError('Task title is required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        title,
        description: state.description,
        status: state.status,
        priority: state.priority,
        assigneeId: state.assigneeId,
        dueDate: state.dueDate || null,
        tags: state.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        estimatePoints: Number(state.estimatePoints) || 1,
      }

      if (mode === 'edit' && task) {
        await onUpdate({
          id: task.id,
          ...payload,
        })
      } else {
        await onCreate({
          projectId,
          ...payload,
        })
      }

      onClose()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Could not save task.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'edit' ? 'Edit task' : 'Create task'}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.22)] animate-modal-in md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{mode === 'edit' ? 'Edit Task' : 'Create New Task'}</h2>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
        </div>

        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]" htmlFor="task-title">
              Title
            </label>
            <Input
              id="task-title"
              autoFocus
              value={state.title}
              onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Write a crisp task title"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]" htmlFor="task-description">
              Description
            </label>
            <textarea
              id="task-description"
              className="min-h-28 w-full rounded-xl border border-[var(--color-border)] bg-white/90 px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent-soft)] focus:ring-2 focus:ring-[var(--color-accent-faint)]"
              value={state.description}
              onChange={(event) => setState((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Describe the outcome and constraints"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]" htmlFor="task-status">
              Status
            </label>
            <select
              id="task-status"
              className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
              value={state.status}
              onChange={(event) =>
                setState((prev) => ({ ...prev, status: event.target.value as TaskStatus }))
              }
            >
              {lanes.map((lane) => (
                <option key={lane.id} value={lane.id}>
                  {lane.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]" htmlFor="task-priority">
              Priority
            </label>
            <select
              id="task-priority"
              className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
              value={state.priority}
              onChange={(event) =>
                setState((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))
              }
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]" htmlFor="task-assignee">
              Assignee
            </label>
            <select
              id="task-assignee"
              className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
              value={state.assigneeId}
              onChange={(event) => setState((prev) => ({ ...prev, assigneeId: event.target.value }))}
            >
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]" htmlFor="task-due-date">
              Due Date
            </label>
            <Input
              id="task-due-date"
              type="date"
              value={state.dueDate}
              onChange={(event) => setState((prev) => ({ ...prev, dueDate: event.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]" htmlFor="task-tags">
              Tags (comma separated)
            </label>
            <Input
              id="task-tags"
              value={state.tags}
              onChange={(event) => setState((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="frontend, release"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]" htmlFor="task-points">
              Estimate Points
            </label>
            <Input
              id="task-points"
              type="number"
              min={1}
              value={state.estimatePoints}
              onChange={(event) => setState((prev) => ({ ...prev, estimatePoints: event.target.value }))}
            />
          </div>

          {error ? (
            <p className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
