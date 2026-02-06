import { getAuthUserId } from '@convex-dev/auth/server'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type AuthContext = Pick<QueryCtx, 'auth'> | Pick<MutationCtx, 'auth'>

export async function requireUserId(ctx: AuthContext): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    throw new Error('You must be authenticated to perform this action.')
  }
  return userId
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function buildAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=ffffff`
}

export function escapePrefixForRange(prefix: string): string {
  return `${prefix}\uffff`
}
