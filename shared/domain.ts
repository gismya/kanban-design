export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const PROJECT_ROLES = ['owner', 'admin', 'member'] as const
export type ProjectRole = (typeof PROJECT_ROLES)[number]

export const [OWNER_PROJECT_ROLE, ADMIN_PROJECT_ROLE, MEMBER_PROJECT_ROLE] = PROJECT_ROLES

export const DEFAULT_TASK_PRIORITY: TaskPriority = 'medium'
export const DEFAULT_PROJECT_ROLE: ProjectRole = MEMBER_PROJECT_ROLE

export function canManageProject(role: ProjectRole) {
  return role === OWNER_PROJECT_ROLE || role === ADMIN_PROJECT_ROLE
}
