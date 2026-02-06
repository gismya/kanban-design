import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const taskStatus = v.union(
  v.literal('backlog'),
  v.literal('todo'),
  v.literal('in_progress'),
  v.literal('review'),
  v.literal('done'),
)

const taskPriority = v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent'))

const projectRole = v.union(v.literal('owner'), v.literal('admin'), v.literal('member'))

export default defineSchema({
  ...authTables,
  profiles: defineTable({
    userId: v.id('users'),
    email: v.string(),
    emailLower: v.string(),
    name: v.string(),
    avatarUrl: v.string(),
  })
    .index('by_userId', ['userId'])
    .index('by_emailLower', ['emailLower']),

  projects: defineTable({
    name: v.string(),
    description: v.string(),
    themeColor: v.string(),
    createdBy: v.id('users'),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_createdBy', ['createdBy']),

  projectMembers: defineTable({
    projectId: v.id('projects'),
    userId: v.id('users'),
    role: projectRole,
    addedBy: v.id('users'),
    createdAt: v.string(),
  })
    .index('by_project_user', ['projectId', 'userId'])
    .index('by_user_project', ['userId', 'projectId'])
    .index('by_project_role', ['projectId', 'role']),

  tasks: defineTable({
    projectId: v.id('projects'),
    title: v.string(),
    description: v.string(),
    status: taskStatus,
    priority: taskPriority,
    assigneeId: v.id('users'),
    dueDate: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
    estimatePoints: v.number(),
    sortOrder: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_status_order', ['projectId', 'status', 'sortOrder']),
})
