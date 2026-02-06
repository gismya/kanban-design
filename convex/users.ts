import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { buildAvatarUrl, escapePrefixForRange, normalizeEmail, requireUserId } from './lib/authHelpers'

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

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
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
