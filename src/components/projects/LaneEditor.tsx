import { useMemo, useState } from 'react'
import { CORE_LANE_LABELS, type ProjectLane } from '../../types/domain'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface LaneEditorProps {
  lanes: ProjectLane[]
  onChange: (lanes: ProjectLane[]) => void
  laneCounts?: Record<string, number>
  disabled?: boolean
}

const coreLaneIds = new Set(Object.keys(CORE_LANE_LABELS))

function normalizeLaneName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

function normalizeLaneNameForComparison(name: string) {
  return normalizeLaneName(name).toLowerCase()
}

function toLaneIdFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
}

function buildUniqueLaneId(name: string, existingIds: Set<string>) {
  const base = toLaneIdFromName(name)
  const safeBase = base && /^[a-z]/.test(base) ? base : 'lane'
  let candidate = safeBase
  let suffix = 2
  while (existingIds.has(candidate)) {
    candidate = `${safeBase}_${suffix}`
    suffix += 1
  }
  return candidate
}

export function LaneEditor({ lanes, onChange, laneCounts, disabled }: LaneEditorProps) {
  const [newLaneName, setNewLaneName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const laneNameSet = useMemo(
    () => new Set(lanes.map((lane) => normalizeLaneNameForComparison(lane.name)).filter(Boolean)),
    [lanes],
  )

  const updateLaneName = (laneId: string, name: string) => {
    const normalizedName = normalizeLaneName(name)
    const normalizedNameLower = normalizedName.toLowerCase()
    const isDuplicateName = lanes.some(
      (lane) => lane.id !== laneId && normalizeLaneNameForComparison(lane.name) === normalizedNameLower,
    )

    if (normalizedName && isDuplicateName) {
      setError('Lane name must be unique.')
      return
    }

    setError(null)
    onChange(
      lanes.map((lane) => (lane.id === laneId ? { ...lane, name: normalizedName } : lane)),
    )
  }

  const moveLane = (laneId: string, direction: -1 | 1) => {
    const index = lanes.findIndex((lane) => lane.id === laneId)
    const targetIndex = index + direction
    if (index < 0 || targetIndex < 0 || targetIndex >= lanes.length) {
      return
    }

    const next = [...lanes]
    const [item] = next.splice(index, 1)
    next.splice(targetIndex, 0, item)
    onChange(next)
  }

  const removeLane = (laneId: string) => {
    if (coreLaneIds.has(laneId)) {
      return
    }
    onChange(lanes.filter((lane) => lane.id !== laneId))
  }

  const addLane = () => {
    const trimmedName = normalizeLaneName(newLaneName)
    if (!trimmedName) {
      setError('Lane name is required.')
      return
    }

    if (laneNameSet.has(trimmedName.toLowerCase())) {
      setError('Lane name must be unique.')
      return
    }

    const nextId = buildUniqueLaneId(trimmedName, new Set(lanes.map((lane) => lane.id)))
    onChange([...lanes, { id: nextId, name: trimmedName }])
    setNewLaneName('')
    setError(null)
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg">Lanes</h3>
        <span className="text-xs uppercase tracking-[0.08em] text-[var(--color-subtle)]">
          {lanes.length} total
        </span>
      </div>

      <div className="space-y-2">
        {lanes.map((lane, index) => {
          const isCoreLane = coreLaneIds.has(lane.id)
          return (
            <div
              key={lane.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => moveLane(lane.id, -1)}
                  disabled={disabled || index === 0}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => moveLane(lane.id, 1)}
                  disabled={disabled || index === lanes.length - 1}
                >
                  Down
                </Button>
              </div>

              <Input
                value={lane.name}
                onChange={(event) => updateLaneName(lane.id, event.target.value)}
                disabled={disabled || isCoreLane}
                className="min-w-48 flex-1"
                aria-label={`Lane name ${lane.id}`}
              />

              <span className="rounded-full bg-[var(--color-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--color-subtle)]">
                {laneCounts?.[lane.id] ?? 0}
              </span>

              {isCoreLane ? (
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]">
                  Core
                </span>
              ) : (
                <Button type="button" variant="secondary" onClick={() => removeLane(lane.id)} disabled={disabled}>
                  Remove
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={newLaneName}
          onChange={(event) => setNewLaneName(event.target.value)}
          placeholder="Add a lane (for example: QA Ready)"
          aria-label="New lane name"
          className="min-w-56 flex-1"
          disabled={disabled}
        />
        <Button type="button" variant="secondary" onClick={addLane} disabled={disabled}>
          Add Lane
        </Button>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
    </div>
  )
}
