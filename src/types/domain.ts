export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type ProjectRole = 'owner' | 'admin' | 'member'

export interface ProjectTaskCounts {
  backlog: number
  todo: number
  in_progress: number
  review: number
  done: number
}

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
  taskCounts: ProjectTaskCounts
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
