import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { buildAvatarUrl, escapePrefixForRange, normalizeEmail, requireUserId } from './lib/authHelpers'
import { resolveProjectLanes } from './lib/lanes'
import { canManageProject, MEMBER_PROJECT_ROLE, OWNER_PROJECT_ROLE } from '../shared/domain'

const EVERYONE_PROJECT_NAME = 'Everyone'
const EVERYONE_PROJECT_DESCRIPTION = 'Shared project that all users can access.'
const EVERYONE_PROJECT_THEME_COLOR = '#0f766e'

export const ensureCurrentProfile = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const userDoc = await ctx.db.get(userId)

    if (!userDoc?.email) {
      throw new Error('Authenticated user has no email address configured.')
    }

    const email = normalizeEmail(userDoc.email)
    const nextName = args.name?.trim() || userDoc.name?.trim() || email.split('@')[0] || 'User'
    const avatarUrl = userDoc.image || buildAvatarUrl(nextName)

    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        emailLower: email,
        name: nextName,
        avatarUrl,
      })
    } else {
      await ctx.db.insert('profiles', {
        userId,
        email,
        emailLower: email,
        name: nextName,
        avatarUrl,
      })
    }

    const now = new Date().toISOString()
    const everyoneProjectName = EVERYONE_PROJECT_NAME.toLowerCase()

    const allProjects = await ctx.db.query('projects').collect()
    const everyoneProject = allProjects.find(
      (project) => project.name.trim().toLowerCase() === everyoneProjectName,
    )

    const everyoneProjectId =
      everyoneProject?._id ??
      (await ctx.db.insert('projects', {
        name: EVERYONE_PROJECT_NAME,
        description: EVERYONE_PROJECT_DESCRIPTION,
        themeColor: EVERYONE_PROJECT_THEME_COLOR,
        lanes: resolveProjectLanes(undefined),
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      }))

    if (!everyoneProject) {
      await ctx.db.insert('projectMembers', {
        projectId: everyoneProjectId,
        userId,
        role: OWNER_PROJECT_ROLE,
        addedBy: userId,
        createdAt: now,
      })
    }

    const existingEveryoneMembership = await ctx.db
      .query('projectMembers')
      .withIndex('by_project_user', (q) => q.eq('projectId', everyoneProjectId).eq('userId', userId))
      .unique()

    if (!existingEveryoneMembership) {
      await ctx.db.insert('projectMembers', {
        projectId: everyoneProjectId,
        userId,
        role: MEMBER_PROJECT_ROLE,
        addedBy: userId,
        createdAt: now,
      })
    }

    return {
      userId,
      email,
      name: nextName,
      avatarUrl,
    }
  },
})

export const searchByEmail = query({
  args: {
    projectId: v.id('projects'),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)

    const requesterMembership = await ctx.db
      .query('projectMembers')
      .withIndex('by_project_user', (q) => q.eq('projectId', args.projectId).eq('userId', userId))
      .unique()

    if (!requesterMembership || !canManageProject(requesterMembership.role)) {
      throw new Error('Only project owners or admins can invite members.')
    }

    const prefix = normalizeEmail(args.query)
    if (prefix.length < 2) {
      return []
    }

    const existingMembers = await ctx.db
      .query('projectMembers')
      .withIndex('by_project_role', (q) => q.eq('projectId', args.projectId))
      .collect()
    const existingMemberIds = new Set(existingMembers.map((member) => member.userId))

    const candidates = await ctx.db
      .query('profiles')
      .withIndex('by_emailLower', (q) => q.gte('emailLower', prefix).lt('emailLower', escapePrefixForRange(prefix)))
      .take(15)

    return candidates
      .filter((profile) => !existingMemberIds.has(profile.userId) && profile.userId !== userId)
      .map((profile) => ({
        userId: profile.userId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      }))
  },
})
