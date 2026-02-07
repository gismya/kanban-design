import type { ProjectLane } from '../types/domain'

function normalizeLaneName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export function validateLaneNames(lanes: ProjectLane[]): string | null {
  const laneNames = new Set<string>()

  for (const lane of lanes) {
    const normalizedName = normalizeLaneName(lane.name)
    if (!normalizedName) {
      return 'Lane name is required.'
    }

    const normalizedNameLower = normalizedName.toLowerCase()
    if (laneNames.has(normalizedNameLower)) {
      return 'Lane name must be unique.'
    }

    laneNames.add(normalizedNameLower)
  }

  return null
}

export function normalizeLanesForSubmit(lanes: ProjectLane[]): ProjectLane[] {
  return lanes.map((lane) => ({
    ...lane,
    name: normalizeLaneName(lane.name),
  }))
}
