import { useCallback, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import { BoardColumns } from '../components/board/BoardColumns'
import { BoardStats } from '../components/board/BoardStats'
import { AppShell } from '../components/layout/AppShell'
import { ProjectMembersModal } from '../components/members/ProjectMembersModal'
import { TaskModal } from '../components/tasks/TaskModal'
import { Button } from '../components/ui/Button'
import { useBoardTaskModal } from '../hooks/useBoardTaskModal'
import { DEFAULT_PROJECT_ROLE, type TaskStatus } from '../types/domain'

export function BoardPage() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const { signOut } = useAuthActions()

  const createTaskMutation = useMutation(api.tasks.createTask)
  const updateTaskMutation = useMutation(api.tasks.updateTask)
  const moveTaskMutation = useMutation(api.tasks.moveTask)
  const quickAddTaskMutation = useMutation(api.tasks.quickAddTask)

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)

  const board = useQuery(
    api.projects.getBoard,
    projectId ? { projectId: projectId as Id<'projects'> } : 'skip',
  )

  const project = board?.project
  const boardTasks = useMemo(() => board?.tasks ?? [], [board?.tasks])
  const members = useMemo(() => board?.members ?? [], [board?.members])
  const laneIds = useMemo(() => (project?.lanes ?? []).map((lane) => lane.id), [project?.lanes])

  const { taskModal, selectedTask, openCreateModal, openEditModal, closeTaskModal } = useBoardTaskModal(
    laneIds,
    boardTasks,
  )

  const taskColumns = useMemo(
    () =>
      (project?.lanes ?? []).map((lane) => ({
        status: lane.id,
        label: lane.name,
        tasks: boardTasks.filter((task) => task.status === lane.id),
      })),
    [boardTasks, project?.lanes],
  )

  const onMoveTask = useCallback(
    async (taskId: string, status: TaskStatus, index: number) => {
      await moveTaskMutation({
        taskId: taskId as Id<'tasks'>,
        status,
        index,
      })
    },
    [moveTaskMutation],
  )

  const onQuickAddTask = useCallback(
    async (status: TaskStatus, title: string) => {
      if (!projectId) {
        return
      }

      await quickAddTaskMutation({
        projectId: projectId as Id<'projects'>,
        status,
        title,
      })
    },
    [projectId, quickAddTaskMutation],
  )

  const totalOpen = project?.openTaskCount ?? 0

  if (!projectId) {
    return <Navigate to="/projects" replace />
  }

  return (
    <AppShell
      title={project?.name ?? 'Board'}
      subtitle={project?.description ?? 'Drag tasks between columns and manage execution flow.'}
      boardProjectId={projectId}
      onLogout={signOut}
      actions={
        project ? (
          <div className="flex items-center gap-2">
            {board?.canManageLanes ? (
              <Button variant="secondary" onClick={() => navigate(`/projects/${projectId}/settings`)}>
                Lanes
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setIsMembersModalOpen(true)}>
              Members
            </Button>
            <Button onClick={openCreateModal}>New Task</Button>
          </div>
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <BoardStats openTaskCount={totalOpen} memberCount={members.length} />

        {board === undefined ? (
          <p className="rounded-2xl border border-[var(--color-border)] bg-white/70 px-4 py-6 text-sm text-[var(--color-subtle)]">
            Loading board...
          </p>
        ) : null}

        {board !== undefined && project ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <BoardColumns
              columns={taskColumns}
              members={members}
              onTaskClick={openEditModal}
              onQuickAdd={onQuickAddTask}
              onMoveTask={onMoveTask}
            />
          </div>
        ) : null}
      </div>

      <TaskModal
        isOpen={taskModal.isOpen}
        mode={taskModal.mode}
        projectId={projectId}
        defaultStatus={taskModal.defaultStatus}
        lanes={project?.lanes ?? []}
        members={members}
        task={selectedTask}
        onClose={closeTaskModal}
        onCreate={async (input) => {
          await createTaskMutation({
            projectId: input.projectId as Id<'projects'>,
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            assigneeId: input.assigneeId as Id<'users'> | undefined,
            dueDate: input.dueDate,
            tags: input.tags,
            estimatePoints: input.estimatePoints,
          })
        }}
        onUpdate={async (input) => {
          await updateTaskMutation({
            id: input.id as Id<'tasks'>,
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            assigneeId: input.assigneeId as Id<'users'> | undefined,
            dueDate: input.dueDate,
            tags: input.tags,
            estimatePoints: input.estimatePoints,
          })
        }}
      />

      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        projectId={projectId}
        members={members}
        viewerRole={board?.viewerRole ?? DEFAULT_PROJECT_ROLE}
        canManageMembers={board?.canManageMembers ?? false}
        onClose={() => setIsMembersModalOpen(false)}
      />

      {board !== undefined && !project ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>Project not found or you no longer have access.</p>
          <Button className="mt-3" variant="secondary" onClick={() => navigate('/projects')}>
            Back to projects
          </Button>
        </div>
      ) : null}
    </AppShell>
  )
}
