import type { ProjectLane as SharedProjectLane } from '../../shared/lanes'
import type {
  ProjectRole as SharedProjectRole,
  TaskPriority as SharedTaskPriority,
} from '../../shared/domain'

export type ProjectLane = SharedProjectLane

export { CORE_LANE_LABELS, DEFAULT_PROJECT_LANES } from '../../shared/lanes'
export {
  ADMIN_PROJECT_ROLE,
  DEFAULT_PROJECT_ROLE,
  DEFAULT_TASK_PRIORITY,
  MEMBER_PROJECT_ROLE,
  OWNER_PROJECT_ROLE,
  PROJECT_ROLES,
  TASK_PRIORITIES,
  canManageProject,
} from '../../shared/domain'

export type TaskStatus = string

export type TaskPriority = SharedTaskPriority

export type ProjectRole = SharedProjectRole

export interface User {
  userId: string
  name: string
  email: string
  avatarUrl: string
  role?: ProjectRole
}

export interface Project {
  id: string
  name: string
  description: string
  themeColor: string
  lanes: ProjectLane[]
  taskCountsByLane: Record<string, number>
  openTaskCount: number
  doneTaskCount: number
  totalTaskCount: number
  viewerRole?: ProjectRole
  updatedAt?: string
  recentActivity?: string
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string
  dueDate: string | null
  tags: string[]
  estimatePoints: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  description: string
  themeColor: string
  lanes: ProjectLane[]
}

export interface CreateTaskInput {
  projectId: string
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  dueDate?: string | null
  tags?: string[]
  estimatePoints?: number
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  dueDate?: string | null
  tags?: string[]
  estimatePoints?: number
}
