export interface ProjectLane {
  id: string
  name: string
}

export const CORE_LANE_LABELS = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  done: 'Done',
} as const

export const DEFAULT_PROJECT_LANES: ProjectLane[] = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'To Do' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'done', name: 'Done' },
]

export type TaskStatus = string

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type ProjectRole = 'owner' | 'admin' | 'member'

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
