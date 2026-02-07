export interface ProjectLane {
  id: string
  name: string
}

export const CORE_LANE_IDS = ['backlog', 'in_progress', 'done'] as const
export type CoreLaneId = (typeof CORE_LANE_IDS)[number]

export const CORE_LANE_LABELS = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  done: 'Done',
} as const satisfies Record<CoreLaneId, string>

export const DEFAULT_PROJECT_LANES: ProjectLane[] = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'To Do' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'done', name: 'Done' },
]
