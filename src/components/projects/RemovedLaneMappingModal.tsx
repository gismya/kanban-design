import type { ProjectLane } from '../../types/domain'
import { Button } from '../ui/Button'

interface RemovedLaneMappingModalProps {
  isOpen: boolean
  removedLanes: ProjectLane[]
  mappings: Record<string, string>
  laneOptions: ProjectLane[]
  isSaving: boolean
  onClose: () => void
  onMappingChange: (fromLaneId: string, toLaneId: string) => void
  onSubmit: () => void
}

export function RemovedLaneMappingModal({
  isOpen,
  removedLanes,
  mappings,
  laneOptions,
  isSaving,
  onClose,
  onMappingChange,
  onSubmit,
}: RemovedLaneMappingModalProps) {
  if (!isOpen) {
    return null
  }

  const isSubmitDisabled = isSaving || removedLanes.some((lane) => !mappings[lane.id])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Map removed lanes"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.22)] md:p-6">
        <h2 className="font-display text-2xl">Map Removed Lanes</h2>
        <p className="mt-2 text-sm text-[var(--color-subtle)]">
          Each removed lane still has tasks. Choose where those tasks should move.
        </p>

        <div className="mt-4 space-y-3">
          {removedLanes.map((lane) => (
            <div key={lane.id} className="rounded-xl border border-[var(--color-border)] bg-white p-3">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]">
                {lane.name}
              </label>
              <select
                className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                value={mappings[lane.id] ?? ''}
                onChange={(event) => onMappingChange(lane.id, event.target.value)}
              >
                <option value="" disabled>
                  Select destination lane
                </option>
                {laneOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitDisabled}>
            {isSaving ? 'Saving...' : 'Save and Move Tasks'}
          </Button>
        </div>
      </div>
    </div>
  )
}
