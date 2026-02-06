import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import { AppShell } from '../components/layout/AppShell'
import { LaneEditor } from '../components/projects/LaneEditor'
import { RemovedLaneMappingModal } from '../components/projects/RemovedLaneMappingModal'
import { Button } from '../components/ui/Button'
import type { ProjectLane } from '../types/domain'

interface MappingState {
  removedLanes: ProjectLane[]
  mappings: Record<string, string>
}

export function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { signOut } = useAuthActions()

  const settings = useQuery(
    api.projects.getProjectSettings,
    projectId ? { projectId: projectId as Id<'projects'> } : 'skip',
  )
  const updateProjectLanes = useMutation(api.projects.updateProjectLanes)

  const [draftLanes, setDraftLanes] = useState<ProjectLane[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mappingState, setMappingState] = useState<MappingState | null>(null)

  const project = settings?.project

  useEffect(() => {
    setDraftLanes([])
  }, [projectId])

  useEffect(() => {
    if (!project) {
      return
    }
    setDraftLanes((prev) => (prev.length === 0 ? project.lanes.map((lane) => ({ ...lane })) : prev))
  }, [project])

  const remainingLaneOptions = useMemo(() => {
    if (!mappingState) {
      return []
    }

    const removedIds = new Set(mappingState.removedLanes.map((lane) => lane.id))
    return draftLanes.filter((lane) => !removedIds.has(lane.id))
  }, [draftLanes, mappingState])

  const submitLaneUpdate = async (removedLaneMappings: Array<{ fromLaneId: string; toLaneId: string }>) => {
    if (!projectId) {
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await updateProjectLanes({
        projectId: projectId as Id<'projects'>,
        lanes: draftLanes,
        removedLaneMappings,
      })
      setMappingState(null)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update project lanes.')
    } finally {
      setIsSaving(false)
    }
  }

  const startSaveFlow = async () => {
    if (!project || !settings?.canManageLanes) {
      return
    }

    const currentLaneIds = new Set(project.lanes.map((lane) => lane.id))
    const nextLaneIds = new Set(draftLanes.map((lane) => lane.id))
    const removedLanes = project.lanes.filter((lane) => currentLaneIds.has(lane.id) && !nextLaneIds.has(lane.id))
    const removedLanesWithTasks = removedLanes.filter((lane) => (project.taskCountsByLane[lane.id] ?? 0) > 0)

    if (removedLanesWithTasks.length === 0) {
      await submitLaneUpdate([])
      return
    }

    const fallbackLaneId = draftLanes.find((lane) => lane.id === 'backlog')?.id ?? draftLanes[0]?.id ?? ''
    const mappings: Record<string, string> = {}
    for (const lane of removedLanesWithTasks) {
      mappings[lane.id] = fallbackLaneId
    }

    setMappingState({
      removedLanes: removedLanesWithTasks,
      mappings,
    })
  }

  if (!projectId) {
    return <Navigate to="/projects" replace />
  }

  return (
    <AppShell
      title={project?.name ? `${project.name} Settings` : 'Project Settings'}
      subtitle="Manage lane configuration for this project."
      boardProjectId={projectId}
      onLogout={signOut}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate(`/board/${projectId}`)}>
            Back to Board
          </Button>
        </div>
      }
    >
      {settings === undefined ? (
        <p className="rounded-2xl border border-[var(--color-border)] bg-white/70 px-4 py-6 text-sm text-[var(--color-subtle)]">
          Loading project settings...
        </p>
      ) : null}

      {settings !== undefined && !project ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>Project not found or you no longer have access.</p>
        </div>
      ) : null}

      {project ? (
        <section className="space-y-4">
          <LaneEditor
            lanes={draftLanes}
            onChange={setDraftLanes}
            laneCounts={project.taskCountsByLane}
            disabled={!settings.canManageLanes || isSaving}
          />

          {!settings.canManageLanes ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Only project owners and admins can update lanes.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setDraftLanes(project.lanes.map((lane) => ({ ...lane })))}
              disabled={isSaving || !settings.canManageLanes}
            >
              Reset
            </Button>
            <Button onClick={() => void startSaveFlow()} disabled={isSaving || !settings.canManageLanes}>
              {isSaving ? 'Saving...' : 'Save Lanes'}
            </Button>
          </div>
        </section>
      ) : null}

      <RemovedLaneMappingModal
        isOpen={Boolean(mappingState)}
        removedLanes={mappingState?.removedLanes ?? []}
        mappings={mappingState?.mappings ?? {}}
        laneOptions={remainingLaneOptions}
        isSaving={isSaving}
        onClose={() => setMappingState(null)}
        onMappingChange={(fromLaneId, toLaneId) =>
          setMappingState((prev) =>
            prev
              ? {
                  ...prev,
                  mappings: {
                    ...prev.mappings,
                    [fromLaneId]: toLaneId,
                  },
                }
              : prev,
          )
        }
        onSubmit={() =>
          void submitLaneUpdate(
            Object.entries(mappingState?.mappings ?? {}).map(([fromLaneId, toLaneId]) => ({
              fromLaneId,
              toLaneId,
            })),
          )
        }
      />
    </AppShell>
  )
}
