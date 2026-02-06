import { mutation, query } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { requireUserId } from './lib/authHelpers'
import { TASK_STATUSES } from './lib/validators'

function emptyTaskCounts() {
  return {
    backlog: 0,
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  }
}

function computeTaskCounts(tasks: Doc<'tasks'>[]) {
  return tasks.reduce(
    (acc, task) => {
      acc[task.status] += 1
      return acc
    },
    emptyTaskCounts(),
  )
}

type DbContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>

async function getMembership(ctx: DbContext, projectId: Id<'projects'>, userId: Id<'users'>) {
  return await ctx.db
    .query('projectMembers')
    .withIndex('by_project_user', (q) => q.eq('projectId', projectId).eq('userId', userId))
    .unique()
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

        const projectTasks = await ctx.db
          .query('tasks')
          .withIndex('by_project', (q) => q.eq('projectId', project._id))
          .collect()

        return {
          id: project._id,
          name: project.name,
          description: project.description,
          themeColor: project.themeColor,
          taskCounts: computeTaskCounts(projectTasks),
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
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)

    const name = args.name.trim()
    if (!name) {
      throw new Error('Project name is required.')
    }

    const description = args.description.trim()
    const now = new Date().toISOString()

    const projectId = await ctx.db.insert('projects', {
      name,
      description,
      themeColor: args.themeColor,
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

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect()

    const statusOrder = new Map(TASK_STATUSES.map((status, index) => [status, index]))
    const orderedTasks = tasks.sort((a, b) => {
      const statusDiff = (statusOrder.get(a.status) ?? 0) - (statusOrder.get(b.status) ?? 0)
      if (statusDiff !== 0) {
        return statusDiff
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

    return {
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        themeColor: project.themeColor,
        taskCounts: computeTaskCounts(tasks),
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
      canManageMembers: membership.role === 'owner' || membership.role === 'admin',
    }
  },
})
