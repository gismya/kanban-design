import { mutation } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { requireUserId } from './lib/authHelpers'
import { getDefaultTaskLaneId, hasLane, resolveProjectLanes } from './lib/lanes'
import { DEFAULT_PROJECT_LANES, taskPriorityValidator, taskStatusValidator } from './lib/validators'
import { DEFAULT_TASK_PRIORITY } from '../shared/domain'

type DbContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>

async function requireProjectMembership(ctx: DbContext, projectId: Id<'projects'>, userId: Id<'users'>) {
  const membership = await ctx.db
    .query('projectMembers')
    .withIndex('by_project_user', (q) => q.eq('projectId', projectId).eq('userId', userId))
    .unique()

  if (!membership) {
    throw new Error('You do not have access to this project.')
  }

  return membership
}

async function requireProject(ctx: DbContext, projectId: Id<'projects'>) {
  const project = await ctx.db.get(projectId)
  if (!project) {
    throw new Error('Project not found.')
  }

  return project
}

async function isProjectMember(ctx: DbContext, projectId: Id<'projects'>, userId: Id<'users'>) {
  const membership = await ctx.db
    .query('projectMembers')
    .withIndex('by_project_user', (q) => q.eq('projectId', projectId).eq('userId', userId))
    .unique()

  return Boolean(membership)
}

function normalizeTags(tags: string[]): string[] {
  return tags.map((tag) => tag.trim()).filter(Boolean)
}

function assertValidLane(lanes: { id: string; name: string }[], laneId: string) {
  if (!hasLane(lanes, laneId)) {
    throw new Error('The selected lane is not configured for this project.')
  }
}

async function nextSortOrder(ctx: DbContext, projectId: Id<'projects'>, status: Doc<'tasks'>['status']) {
  const tasks = await ctx.db
    .query('tasks')
    .withIndex('by_project_status_order', (q) => q.eq('projectId', projectId).eq('status', status))
    .collect()

  const maxSort = tasks.reduce((max: number, task: Doc<'tasks'>) => Math.max(max, task.sortOrder), 0)
  return maxSort + 1000
}

function mapTask(task: Doc<'tasks'>) {
  return {
    id: task._id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId,
    dueDate: task.dueDate,
    tags: task.tags,
    estimatePoints: task.estimatePoints,
    sortOrder: task.sortOrder,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

export const createTask = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(taskStatusValidator),
    priority: v.optional(taskPriorityValidator),
    assigneeId: v.optional(v.id('users')),
    dueDate: v.optional(v.union(v.string(), v.null())),
    tags: v.optional(v.array(v.string())),
    estimatePoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    await requireProjectMembership(ctx, args.projectId, userId)

    const project = await requireProject(ctx, args.projectId)
    const lanes = resolveProjectLanes(project.lanes)

    const title = args.title.trim()
    if (!title) {
      throw new Error('Task title is required.')
    }

    const status = args.status ?? getDefaultTaskLaneId(lanes)
    assertValidLane(lanes, status)

    const assigneeCandidate = args.assigneeId ?? userId
    const assigneeId =
      (await isProjectMember(ctx, args.projectId, assigneeCandidate)) ? assigneeCandidate : userId

    const now = new Date().toISOString()
    const taskId = await ctx.db.insert('tasks', {
      projectId: args.projectId,
      title,
      description: args.description?.trim() ?? '',
      status,
      priority: args.priority ?? DEFAULT_TASK_PRIORITY,
      assigneeId,
      dueDate: args.dueDate ?? null,
      tags: normalizeTags(args.tags ?? []),
      estimatePoints: args.estimatePoints ?? 1,
      sortOrder: await nextSortOrder(ctx, args.projectId, status),
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.patch(args.projectId, { updatedAt: now })

    const created = await ctx.db.get(taskId)
    if (!created) {
      throw new Error('Could not create task.')
    }

    return mapTask(created)
  },
})

export const quickAddTask = mutation({
  args: {
    projectId: v.id('projects'),
    status: taskStatusValidator,
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    await requireProjectMembership(ctx, args.projectId, userId)

    const project = await requireProject(ctx, args.projectId)
    const lanes = resolveProjectLanes(project.lanes)
    assertValidLane(lanes, args.status)

    const title = args.title.trim()
    if (!title) {
      throw new Error('Task title is required.')
    }

    const now = new Date().toISOString()
    const taskId = await ctx.db.insert('tasks', {
      projectId: args.projectId,
      title,
      description: '',
      status: args.status,
      priority: DEFAULT_TASK_PRIORITY,
      assigneeId: userId,
      dueDate: null,
      tags: [],
      estimatePoints: 1,
      sortOrder: await nextSortOrder(ctx, args.projectId, args.status),
      createdAt: now,
      updatedAt: now,
    })

    const created = await ctx.db.get(taskId)
    if (!created) {
      throw new Error('Could not create task.')
    }

    return mapTask(created)
  },
})

export const updateTask = mutation({
  args: {
    id: v.id('tasks'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(taskStatusValidator),
    priority: v.optional(taskPriorityValidator),
    assigneeId: v.optional(v.id('users')),
    dueDate: v.optional(v.union(v.string(), v.null())),
    tags: v.optional(v.array(v.string())),
    estimatePoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db.get(args.id)

    if (!existing) {
      throw new Error('Task not found.')
    }

    await requireProjectMembership(ctx, existing.projectId, userId)

    const project = await requireProject(ctx, existing.projectId)
    const lanes = resolveProjectLanes(project.lanes)

    const nextStatus = args.status ?? existing.status
    assertValidLane(lanes, nextStatus)

    const nextTitle = args.title !== undefined ? args.title.trim() : existing.title
    if (!nextTitle) {
      throw new Error('Task title is required.')
    }

    const nextAssigneeCandidate = args.assigneeId ?? existing.assigneeId
    const nextAssigneeId =
      (await isProjectMember(ctx, existing.projectId, nextAssigneeCandidate))
        ? nextAssigneeCandidate
        : existing.assigneeId

    const sortOrder =
      args.status !== undefined && args.status !== existing.status
        ? await nextSortOrder(ctx, existing.projectId, nextStatus)
        : existing.sortOrder

    const now = new Date().toISOString()

    await ctx.db.patch(args.id, {
      title: nextTitle,
      description: args.description !== undefined ? args.description.trim() : existing.description,
      status: nextStatus,
      priority: args.priority ?? existing.priority,
      assigneeId: nextAssigneeId,
      dueDate: args.dueDate !== undefined ? args.dueDate : existing.dueDate,
      tags: args.tags !== undefined ? normalizeTags(args.tags) : existing.tags,
      estimatePoints: args.estimatePoints ?? existing.estimatePoints,
      sortOrder,
      updatedAt: now,
    })

    const updated = await ctx.db.get(args.id)
    if (!updated) {
      throw new Error('Task update failed.')
    }

    return mapTask(updated)
  },
})

export const moveTask = mutation({
  args: {
    taskId: v.id('tasks'),
    status: taskStatusValidator,
    index: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const task = await ctx.db.get(args.taskId)

    if (!task) {
      throw new Error('Task not found.')
    }

    await requireProjectMembership(ctx, task.projectId, userId)

    const project = await requireProject(ctx, task.projectId)
    const lanes = resolveProjectLanes(project.lanes)
    assertValidLane(lanes, args.status)

    const sourceStatus = task.status
    const destinationStatus = args.status

    const sourceTasks = (
      await ctx.db
        .query('tasks')
        .withIndex('by_project_status_order', (q) =>
          q.eq('projectId', task.projectId).eq('status', sourceStatus),
        )
        .collect()
    ).filter((candidate) => candidate._id !== task._id)

    const destinationBase =
      sourceStatus === destinationStatus
        ? sourceTasks
        : await ctx.db
            .query('tasks')
            .withIndex('by_project_status_order', (q) =>
              q.eq('projectId', task.projectId).eq('status', destinationStatus),
            )
            .collect()

    const clampedIndex = Math.max(0, Math.min(args.index, destinationBase.length))
    const destinationTasks = [...destinationBase]
    destinationTasks.splice(clampedIndex, 0, { ...task, status: destinationStatus })

    const patchStatusBucket = async (bucket: Doc<'tasks'>[], status: Doc<'tasks'>['status']) => {
      for (let index = 0; index < bucket.length; index += 1) {
        const item = bucket[index]
        const targetSortOrder = (index + 1) * 1000

        const needsPatch = item.sortOrder !== targetSortOrder || item.status !== status || item._id === task._id
        if (!needsPatch) {
          continue
        }

        await ctx.db.patch(item._id, {
          status,
          sortOrder: targetSortOrder,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    await patchStatusBucket(destinationTasks, destinationStatus)
    if (sourceStatus !== destinationStatus) {
      await patchStatusBucket(sourceTasks, sourceStatus)
    }

    return null
  },
})

export const taskStatuses = mutation({
  args: {},
  handler: async () => {
    return DEFAULT_PROJECT_LANES.map((lane) => lane.id)
  },
})
