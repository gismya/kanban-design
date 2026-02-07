import { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  ADMIN_PROJECT_ROLE,
  DEFAULT_PROJECT_ROLE,
  OWNER_PROJECT_ROLE,
  PROJECT_ROLES,
  type ProjectRole,
  type User,
} from '../../types/domain'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface ProjectMembersModalProps {
  isOpen: boolean
  projectId: string
  members: User[]
  viewerRole: ProjectRole
  canManageMembers: boolean
  onClose: () => void
}

const ROLE_OPTIONS: ProjectRole[] = [...PROJECT_ROLES]

export function ProjectMembersModal({
  isOpen,
  projectId,
  members,
  viewerRole,
  canManageMembers,
  onClose,
}: ProjectMembersModalProps) {
  const inviteMember = useMutation(api.memberships.inviteMember)
  const updateMemberRole = useMutation(api.memberships.updateMemberRole)
  const removeMember = useMutation(api.memberships.removeMember)
  const projectDocId = projectId as Id<'projects'>

  const [search, setSearch] = useState('')
  const [inviteRole, setInviteRole] = useState<ProjectRole>(DEFAULT_PROJECT_ROLE)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const inviteResults = useQuery(
    api.users.searchByEmail,
    canManageMembers && search.trim().length >= 2 ? { projectId: projectDocId, query: search.trim() } : 'skip',
  )

  const availableRoleOptions = useMemo(
    () =>
      viewerRole === OWNER_PROJECT_ROLE
        ? ROLE_OPTIONS
        : ROLE_OPTIONS.filter((role) => role !== OWNER_PROJECT_ROLE),
    [viewerRole],
  )

  if (!isOpen) {
    return null
  }

  const handleInvite = async (email: string) => {
    setError(null)
    setIsSaving(true)
    try {
      await inviteMember({
        projectId: projectDocId,
        email,
        role: inviteRole,
      })
      setSearch('')
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Could not invite member.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRoleUpdate = async (userId: string, role: ProjectRole) => {
    setError(null)
    setIsSaving(true)
    try {
      await updateMemberRole({
        projectId: projectDocId,
        userId: userId as Id<'users'>,
        role,
      })
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update role.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async (userId: string) => {
    setError(null)
    setIsSaving(true)
    try {
      await removeMember({
        projectId: projectDocId,
        userId: userId as Id<'users'>,
      })
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove member.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Project members"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.22)] md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Project Members</h2>
            <p className="text-sm text-[var(--color-subtle)]">Role: {viewerRole}</p>
          </div>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Close
          </Button>
        </div>

        <div className="space-y-3">
          {members.map((member) => {
            const canEditRole =
              canManageMembers && !(viewerRole === ADMIN_PROJECT_ROLE && member.role === OWNER_PROJECT_ROLE)
            const canRemove =
              canManageMembers && !(viewerRole === ADMIN_PROJECT_ROLE && member.role === OWNER_PROJECT_ROLE)

            return (
              <div
                key={member.userId}
                className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white/80 p-3 md:grid-cols-[1fr_180px_120px] md:items-center"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-[var(--color-border)]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{member.name}</p>
                    <p className="text-xs text-[var(--color-subtle)]">{member.email}</p>
                  </div>
                </div>

                <select
                  className="min-h-10 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                  value={member.role}
                  disabled={!canEditRole || isSaving}
                  onChange={(event) => void handleRoleUpdate(member.userId, event.target.value as ProjectRole)}
                >
                  {availableRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <Button
                  variant="secondary"
                  disabled={!canRemove || isSaving}
                  onClick={() => void handleRemove(member.userId)}
                >
                  Remove
                </Button>
              </div>
            )
          })}
        </div>

        {canManageMembers ? (
          <section className="mt-5 rounded-2xl border border-[var(--color-border)] bg-white/80 p-4">
            <h3 className="font-display text-xl">Invite Existing User</h3>
            <p className="mt-1 text-sm text-[var(--color-subtle)]">Search by email (minimum 2 characters).</p>

            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_150px]">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search email"
                aria-label="Search users by email"
              />
              <select
                className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as ProjectRole)}
                disabled={isSaving}
              >
                {availableRoleOptions.map((role) => (
                  <option key={role} value={role}>
                    Invite as {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 space-y-2">
              {(inviteResults ?? []).map((candidate) => (
                <div
                  key={candidate.userId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{candidate.name}</p>
                    <p className="text-xs text-[var(--color-subtle)]">{candidate.email}</p>
                  </div>
                  <Button
                    variant="primary"
                    disabled={isSaving}
                    onClick={() => void handleInvite(candidate.email)}
                  >
                    Invite
                  </Button>
                </div>
              ))}

              {search.trim().length >= 2 && inviteResults?.length === 0 ? (
                <p className="text-xs text-[var(--color-subtle)]">No matching eligible users found.</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
      </div>
    </div>
  )
}
