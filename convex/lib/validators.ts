import { v } from 'convex/values'

export const CORE_LANE_IDS = ['backlog', 'in_progress', 'done'] as const
export type CoreLaneId = (typeof CORE_LANE_IDS)[number]

export const CORE_LANE_LABELS: Record<CoreLaneId, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  done: 'Done',
}

export const DEFAULT_PROJECT_LANES = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'To Do' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'done', name: 'Done' },
] as const

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const PROJECT_ROLES = ['owner', 'admin', 'member'] as const
export type ProjectRole = (typeof PROJECT_ROLES)[number]

export const taskStatusValidator = v.string()

export const projectLaneValidator = v.object({
  id: v.string(),
  name: v.string(),
})

export const projectLanesValidator = v.array(projectLaneValidator)

export const taskPriorityValidator = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
  v.literal('urgent'),
)

export const projectRoleValidator = v.union(v.literal('owner'), v.literal('admin'), v.literal('member'))
