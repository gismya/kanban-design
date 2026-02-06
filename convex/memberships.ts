import { mutation } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { normalizeEmail, requireUserId } from './lib/authHelpers'
import { projectRoleValidator } from './lib/validators'

type DbContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>
type AuthDbContext = Pick<QueryCtx, 'db' | 'auth'> | Pick<MutationCtx, 'db' | 'auth'>

async function getMembership(ctx: DbContext, projectId: Id<'projects'>, userId: Id<'users'>) {
  return await ctx.db
    .query('projectMembers')
    .withIndex('by_project_user', (q) => q.eq('projectId', projectId).eq('userId', userId))
    .unique()
}

async function requireManager(ctx: AuthDbContext, projectId: Id<'projects'>, userId: Id<'users'>) {
  const membership = await getMembership(ctx, projectId, userId)
  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    throw new Error('Only project owners or admins can manage members.')
  }
  return membership
}

async function countOwners(ctx: DbContext, projectId: Id<'projects'>): Promise<number> {
  const ownerRows = await ctx.db
    .query('projectMembers')
    .withIndex('by_project_role', (q) => q.eq('projectId', projectId).eq('role', 'owner'))
    .collect()
  return ownerRows.length
}

async function resolveProfileByEmail(ctx: DbContext, email: string) {
  return await ctx.db
    .query('profiles')
    .withIndex('by_emailLower', (q) => q.eq('emailLower', normalizeEmail(email)))
    .unique()
}

function canManageMembers(role: Doc<'projectMembers'>['role']) {
  return role === 'owner' || role === 'admin'
}

export const inviteMember = mutation({
  args: {
    projectId: v.id('projects'),
    email: v.string(),
    role: projectRoleValidator,
  },
  handler: async (ctx, args) => {
    const requesterId = await requireUserId(ctx)
    const requesterMembership = await requireManager(ctx, args.projectId, requesterId)

    if (requesterMembership.role === 'admin' && args.role === 'owner') {
      throw new Error('Admins cannot invite owners.')
    }

    const profile = await resolveProfileByEmail(ctx, args.email)
    if (!profile) {
      throw new Error('No registered user was found for that email address.')
    }

    const existingMembership = await getMembership(ctx, args.projectId, profile.userId)
    if (existingMembership) {
      throw new Error('This user is already a project member.')
    }

    const now = new Date().toISOString()
    await ctx.db.insert('projectMembers', {
      projectId: args.projectId,
      userId: profile.userId,
      role: args.role,
      addedBy: requesterId,
      createdAt: now,
    })

    return { ok: true }
  },
})

export const updateMemberRole = mutation({
  args: {
    projectId: v.id('projects'),
    userId: v.id('users'),
    role: projectRoleValidator,
  },
  handler: async (ctx, args) => {
    const requesterId = await requireUserId(ctx)
    const requesterMembership = await requireManager(ctx, args.projectId, requesterId)
    const targetMembership = await getMembership(ctx, args.projectId, args.userId)

    if (!targetMembership) {
      throw new Error('Target member does not exist.')
    }

    if (!canManageMembers(requesterMembership.role)) {
      throw new Error('Only project owners or admins can update member roles.')
    }

    if (requesterMembership.role === 'admin') {
      if (targetMembership.role === 'owner') {
        throw new Error('Admins cannot modify owners.')
      }
      if (args.role === 'owner') {
        throw new Error('Admins cannot promote members to owner.')
      }
    }

    if (targetMembership.role === 'owner' && args.role !== 'owner') {
      const ownerCount = await countOwners(ctx, args.projectId)
      if (ownerCount <= 1) {
        throw new Error('The last owner cannot be demoted.')
      }
    }

    await ctx.db.patch(targetMembership._id, {
      role: args.role,
    })

    return { ok: true }
  },
})

export const removeMember = mutation({
  args: {
    projectId: v.id('projects'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const requesterId = await requireUserId(ctx)
    const requesterMembership = await requireManager(ctx, args.projectId, requesterId)
    const targetMembership = await getMembership(ctx, args.projectId, args.userId)

    if (!targetMembership) {
      throw new Error('Target member does not exist.')
    }

    if (requesterMembership.role === 'admin' && targetMembership.role === 'owner') {
      throw new Error('Admins cannot remove owners.')
    }

    if (targetMembership.role === 'owner') {
      const ownerCount = await countOwners(ctx, args.projectId)
      if (ownerCount <= 1) {
        throw new Error('The last owner cannot be removed.')
      }
    }

    await ctx.db.delete(targetMembership._id)
    return { ok: true }
  },
})
