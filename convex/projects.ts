import { mutation, query } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { requireUserId } from './lib/authHelpers'
import { normalizeLaneDrafts, resolveProjectLanes } from './lib/lanes'
import { projectLanesValidator } from './lib/validators'

type DbContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>

async function getMembership(ctx: DbContext, projectId: Id<'projects'>, userId: Id<'users'>) {
  return await ctx.db
    .query('projectMembers')
    .withIndex('by_project_user', (q) => q.eq('projectId', projectId).eq('userId', userId))
    .unique()
}

function canManageProject(role: Doc<'projectMembers'>['role']) {
  return role === 'owner' || role === 'admin'
}

async function resolveMemberProfile(ctx: DbContext, userId: Id<'users'>) {
  const profile = await ctx.db.query('profiles').withIndex('by_userId', (q) => q.eq('userId', userId)).unique()
  if (profile) {
    return profile
  }

  const user = await ctx.db.get(userId)
  return {
    userId,
    email: user?.email ?? 'unknown@example.com',
    name: user?.name ?? user?.email?.split('@')[0] ?? 'User',
    avatarUrl: user?.image ?? 'https://ui-avatars.com/api/?name=User&background=0f766e&color=ffffff',
  }
}

function computeTaskStats(tasks: Doc<'tasks'>[], lanes: { id: string }[]) {
  const taskCountsByLane: Record<string, number> = {}
  for (const lane of lanes) {
    taskCountsByLane[lane.id] = 0
  }

  for (const task of tasks) {
    taskCountsByLane[task.status] = (taskCountsByLane[task.status] ?? 0) + 1
  }

  const totalTaskCount = tasks.length
  const doneTaskCount = taskCountsByLane.done ?? 0

  return {
    taskCountsByLane,
    totalTaskCount,
    doneTaskCount,
    openTaskCount: totalTaskCount - doneTaskCount,
  }
}

async function reindexLaneTasks(ctx: MutationCtx, projectId: Id<'projects'>, laneId: string, now: string) {
  const laneTasks = await ctx.db
    .query('tasks')
    .withIndex('by_project_status_order', (q) => q.eq('projectId', projectId).eq('status', laneId))
    .collect()

  for (let index = 0; index < laneTasks.length; index += 1) {
    const task = laneTasks[index]
    const targetSortOrder = (index + 1) * 1000
    if (task.sortOrder === targetSortOrder) {
      continue
    }

    await ctx.db.patch(task._id, {
      sortOrder: targetSortOrder,
      updatedAt: now,
    })
  }
}

export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)

    const memberships = await ctx.db
      .query('projectMembers')
      .withIndex('by_user_project', (q) => q.eq('userId', userId))
      .collect()

    const projects = await Promise.all(
      memberships.map(async (membership) => {
        const project = await ctx.db.get(membership.projectId)
        if (!project) {
          return null
        }

        const lanes = resolveProjectLanes(project.lanes)
        const projectTasks = await ctx.db
          .query('tasks')
          .withIndex('by_project', (q) => q.eq('projectId', project._id))
          .collect()

        const stats = computeTaskStats(projectTasks, lanes)

        return {
          id: project._id,
          name: project.name,
          description: project.description,
          themeColor: project.themeColor,
          lanes,
          taskCountsByLane: stats.taskCountsByLane,
          openTaskCount: stats.openTaskCount,
          doneTaskCount: stats.doneTaskCount,
          totalTaskCount: stats.totalTaskCount,
          viewerRole: membership.role,
          updatedAt: project.updatedAt,
          recentActivity: undefined,
        }
      }),
    )

    return projects
      .filter((project): project is NonNullable<typeof project> => Boolean(project))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
})

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    themeColor: v.string(),
    lanes: v.optional(projectLanesValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)

    const name = args.name.trim()
    if (!name) {
      throw new Error('Project name is required.')
    }

    const description = args.description.trim()
    const lanes = args.lanes ? normalizeLaneDrafts(args.lanes) : resolveProjectLanes(undefined)
    const now = new Date().toISOString()

    const projectId = await ctx.db.insert('projects', {
      name,
      description,
      themeColor: args.themeColor,
      lanes,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('projectMembers', {
      projectId,
      userId,
      role: 'owner',
      addedBy: userId,
      createdAt: now,
    })

    return { projectId }
  },
})

export const getBoard = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const membership = await getMembership(ctx, args.projectId, userId)

    if (!membership) {
      return null
    }

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return null
    }

    const lanes = resolveProjectLanes(project.lanes)
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect()

    const laneOrder = new Map(lanes.map((lane, index) => [lane.id, index]))
    const orderedTasks = tasks.sort((a, b) => {
      const aLaneOrder = laneOrder.get(a.status) ?? Number.MAX_SAFE_INTEGER
      const bLaneOrder = laneOrder.get(b.status) ?? Number.MAX_SAFE_INTEGER

      if (aLaneOrder !== bLaneOrder) {
        return aLaneOrder - bLaneOrder
      }

      return a.sortOrder - b.sortOrder
    })

    const memberRows = await ctx.db
      .query('projectMembers')
      .withIndex('by_project_role', (q) => q.eq('projectId', args.projectId))
      .collect()

    const members = await Promise.all(
      memberRows.map(async (member) => {
        const profile = await resolveMemberProfile(ctx, member.userId)
        return {
          userId: member.userId,
          role: member.role,
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        }
      }),
    )

    const stats = computeTaskStats(tasks, lanes)
    const canManageLanes = canManageProject(membership.role)

    return {
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        themeColor: project.themeColor,
        lanes,
        taskCountsByLane: stats.taskCountsByLane,
        openTaskCount: stats.openTaskCount,
        doneTaskCount: stats.doneTaskCount,
        totalTaskCount: stats.totalTaskCount,
        viewerRole: membership.role,
        updatedAt: project.updatedAt,
      },
      tasks: orderedTasks.map((task) => ({
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
      })),
      members,
      viewerRole: membership.role,
      canManageMembers: canManageLanes,
      canManageLanes,
    }
  },
})

export const getProjectSettings = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const membership = await getMembership(ctx, args.projectId, userId)

    if (!membership) {
      return null
    }

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      return null
    }

    const lanes = resolveProjectLanes(project.lanes)
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect()

    const stats = computeTaskStats(tasks, lanes)
    const canManageLanes = canManageProject(membership.role)

    return {
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        themeColor: project.themeColor,
        lanes,
        taskCountsByLane: stats.taskCountsByLane,
        openTaskCount: stats.openTaskCount,
        doneTaskCount: stats.doneTaskCount,
        totalTaskCount: stats.totalTaskCount,
        viewerRole: membership.role,
        updatedAt: project.updatedAt,
      },
      viewerRole: membership.role,
      canManageLanes,
    }
  },
})

export const updateProjectLanes = mutation({
  args: {
    projectId: v.id('projects'),
    lanes: projectLanesValidator,
    removedLaneMappings: v.optional(
      v.array(
        v.object({
          fromLaneId: v.string(),
          toLaneId: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const membership = await getMembership(ctx, args.projectId, userId)

    if (!membership) {
      throw new Error('You do not have access to this project.')
    }

    if (!canManageProject(membership.role)) {
      throw new Error('Only project owners or admins can update lanes.')
    }

    const project = await ctx.db.get(args.projectId)
    if (!project) {
      throw new Error('Project not found.')
    }

    const currentLanes = resolveProjectLanes(project.lanes)
    const nextLanes = normalizeLaneDrafts(args.lanes)

    const currentLaneIds = new Set(currentLanes.map((lane) => lane.id))
    const nextLaneIds = new Set(nextLanes.map((lane) => lane.id))
    const removedLaneIds = Array.from(currentLaneIds).filter((laneId) => !nextLaneIds.has(laneId))
    const removedLaneSet = new Set(removedLaneIds)

    const mappingRows = args.removedLaneMappings ?? []
    const laneMapping = new Map<string, string>()
    for (const mapping of mappingRows) {
      if (laneMapping.has(mapping.fromLaneId)) {
        throw new Error(`Duplicate lane mapping for "${mapping.fromLaneId}".`)
      }
      laneMapping.set(mapping.fromLaneId, mapping.toLaneId)
    }

    const now = new Date().toISOString()
    const lanesToReindex = new Set<string>()

    for (const removedLaneId of removedLaneIds) {
      const laneTasks = await ctx.db
        .query('tasks')
        .withIndex('by_project_status_order', (q) =>
          q.eq('projectId', args.projectId).eq('status', removedLaneId),
        )
        .collect()

      if (laneTasks.length === 0) {
        continue
      }

      const destinationLaneId = laneMapping.get(removedLaneId)
      if (!destinationLaneId) {
        throw new Error(`Please choose a destination for lane "${removedLaneId}".`)
      }

      if (!nextLaneIds.has(destinationLaneId) || removedLaneSet.has(destinationLaneId)) {
        throw new Error(`Destination lane "${destinationLaneId}" is not valid.`)
      }

      const destinationTasks = await ctx.db
        .query('tasks')
        .withIndex('by_project_status_order', (q) =>
          q.eq('projectId', args.projectId).eq('status', destinationLaneId),
        )
        .collect()

      let nextSortOrder = destinationTasks.reduce((max, task) => Math.max(max, task.sortOrder), 0) + 1000
      for (const task of laneTasks) {
        await ctx.db.patch(task._id, {
          status: destinationLaneId,
          sortOrder: nextSortOrder,
          updatedAt: now,
        })
        nextSortOrder += 1000
      }

      lanesToReindex.add(destinationLaneId)
    }

    for (const laneId of lanesToReindex) {
      await reindexLaneTasks(ctx, args.projectId, laneId, now)
    }

    await ctx.db.patch(args.projectId, {
      lanes: nextLanes,
      updatedAt: now,
    })

    return { ok: true }
  },
})
