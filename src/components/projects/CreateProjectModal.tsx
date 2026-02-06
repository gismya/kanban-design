import { useState, type FormEvent } from 'react'
import { DEFAULT_PROJECT_LANES, type CreateProjectInput, type ProjectLane } from '../../types/domain'
import { LaneEditor } from './LaneEditor'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (input: CreateProjectInput) => Promise<void>
}

const THEME_COLORS = ['#129C99', '#2563EB', '#D97706', '#BE123C', '#0F766E', '#4F46E5']

export function CreateProjectModal({ isOpen, onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [themeColor, setThemeColor] = useState(THEME_COLORS[0])
  const [lanes, setLanes] = useState<ProjectLane[]>(DEFAULT_PROJECT_LANES.map((lane) => ({ ...lane })))
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) {
    return null
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const normalizedName = name.trim()
    if (!normalizedName) {
      setError('Project name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await onCreate({
        name: normalizedName,
        description,
        themeColor,
        lanes,
      })
      setName('')
      setDescription('')
      setThemeColor(THEME_COLORS[0])
      setLanes(DEFAULT_PROJECT_LANES.map((lane) => ({ ...lane })))
      onClose()
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : 'Could not create project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Create project"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.22)] md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Create New Project</h2>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]"
              htmlFor="project-name"
            >
              Name
            </label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project name"
              autoFocus
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]"
              htmlFor="project-description"
            >
              Description
            </label>
            <textarea
              id="project-description"
              className="min-h-28 w-full rounded-xl border border-[var(--color-border)] bg-white/90 px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent-soft)] focus:ring-2 focus:ring-[var(--color-accent-faint)]"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this project for?"
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]">
              Theme color
            </p>
            <div className="flex flex-wrap gap-2">
              {THEME_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select theme ${color}`}
                  onClick={() => setThemeColor(color)}
                  className="h-8 w-8 rounded-full border-2"
                  style={{
                    backgroundColor: color,
                    borderColor: themeColor === color ? 'rgb(15 23 42)' : 'rgb(226 232 240)',
                  }}
                />
              ))}
            </div>
          </div>

          <LaneEditor lanes={lanes} onChange={setLanes} disabled={isSubmitting} />

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
