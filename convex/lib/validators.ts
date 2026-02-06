import { v } from 'convex/values'

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const PROJECT_ROLES = ['owner', 'admin', 'member'] as const
export type ProjectRole = (typeof PROJECT_ROLES)[number]

export const taskStatusValidator = v.union(
  v.literal('backlog'),
  v.literal('todo'),
  v.literal('in_progress'),
  v.literal('review'),
  v.literal('done'),
)

export const taskPriorityValidator = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
  v.literal('urgent'),
)

export const projectRoleValidator = v.union(v.literal('owner'), v.literal('admin'), v.literal('member'))
