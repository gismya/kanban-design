import type { Doc } from '../_generated/dataModel'
import { CORE_LANE_IDS, CORE_LANE_LABELS, DEFAULT_PROJECT_LANES } from './validators'
import type { ProjectLane } from '../../shared/lanes'

const LANE_ID_PATTERN = /^[a-z][a-z0-9_]*$/

function sanitizeLaneName(rawName: string) {
  return rawName.trim().replace(/\s+/g, ' ')
}

function normalizeLaneId(rawId: string) {
  const value = rawId
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')

  return value
}

export function toLaneIdFromName(name: string) {
  const normalized = normalizeLaneId(name)
  if (!normalized || !LANE_ID_PATTERN.test(normalized)) {
    throw new Error('Lane names must produce a valid id (letters, numbers, underscore; must start with a letter).')
  }

  return normalized
}

export function normalizeLaneDrafts(drafts: ProjectLane[]): ProjectLane[] {
  if (drafts.length === 0) {
    throw new Error('At least one lane is required.')
  }

  const normalizedLanes = drafts.map((draft) => {
    const normalizedName = sanitizeLaneName(draft.name)
    if (!normalizedName) {
      throw new Error('Lane name is required.')
    }

    const normalizedId = normalizeLaneId(draft.id || normalizedName)
    if (!normalizedId || !LANE_ID_PATTERN.test(normalizedId)) {
      throw new Error('Lane ids must use letters, numbers, and underscore, and start with a letter.')
    }

    return {
      id: normalizedId,
      name: normalizedName,
    }
  })

  const laneIds = new Set<string>()
  const laneNamesLower = new Set<string>()
  for (const lane of normalizedLanes) {
    if (laneIds.has(lane.id)) {
      throw new Error(`Lane id "${lane.id}" is duplicated.`)
    }
    laneIds.add(lane.id)

    const nameLower = lane.name.toLowerCase()
    if (laneNamesLower.has(nameLower)) {
      throw new Error(`Lane name "${lane.name}" is duplicated.`)
    }
    laneNamesLower.add(nameLower)
  }

  for (const coreLaneId of CORE_LANE_IDS) {
    const found = normalizedLanes.find((lane) => lane.id === coreLaneId)
    if (!found) {
      throw new Error(`Lane "${CORE_LANE_LABELS[coreLaneId]}" is required.`)
    }
    if (found.name !== CORE_LANE_LABELS[coreLaneId]) {
      throw new Error(`Lane "${CORE_LANE_LABELS[coreLaneId]}" cannot be renamed.`)
    }
  }

  return normalizedLanes
}

export function resolveProjectLanes(projectLanes: Doc<'projects'>['lanes'] | undefined): ProjectLane[] {
  if (!projectLanes || projectLanes.length === 0) {
    return DEFAULT_PROJECT_LANES.map((lane) => ({ ...lane }))
  }

  try {
    return normalizeLaneDrafts(projectLanes)
  } catch {
    return DEFAULT_PROJECT_LANES.map((lane) => ({ ...lane }))
  }
}

export function hasLane(lanes: ProjectLane[], laneId: string) {
  return lanes.some((lane) => lane.id === laneId)
}

export function getDefaultTaskLaneId(lanes: ProjectLane[]) {
  if (hasLane(lanes, 'todo')) {
    return 'todo'
  }

  return 'backlog'
}
