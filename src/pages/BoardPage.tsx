import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import { KanbanColumn } from '../components/board/KanbanColumn'
import { TaskCardPreview } from '../components/board/TaskCard'
import { resolveMoveInstruction } from '../components/board/boardDnd'
import { AppShell } from '../components/layout/AppShell'
import { ProjectMembersModal } from '../components/members/ProjectMembersModal'
import { TaskModal } from '../components/tasks/TaskModal'
import { Button } from '../components/ui/Button'
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from '../types/domain'

type TaskModalState =
  | {
      isOpen: false
      mode: 'create' | 'edit'
      taskId: null
      defaultStatus: TaskStatus
    }
  | {
      isOpen: true
      mode: 'create' | 'edit'
      taskId: string | null
      defaultStatus: TaskStatus
    }

const DEFAULT_MODAL_STATE: TaskModalState = {
  isOpen: false,
  mode: 'create',
  taskId: null,
  defaultStatus: 'todo',
}

export function BoardPage() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const { signOut } = useAuthActions()

  const createTaskMutation = useMutation(api.tasks.createTask)
  const updateTaskMutation = useMutation(api.tasks.updateTask)
  const moveTaskMutation = useMutation(api.tasks.moveTask)
  const quickAddTaskMutation = useMutation(api.tasks.quickAddTask)

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [taskModal, setTaskModal] = useState<TaskModalState>(DEFAULT_MODAL_STATE)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)

  const board = useQuery(
    api.projects.getBoard,
    projectId ? { projectId: projectId as Id<'projects'> } : 'skip',
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const project = board?.project
  const boardTasks = useMemo(() => board?.tasks ?? [], [board?.tasks])
  const members = useMemo(() => board?.members ?? [], [board?.members])

  const selectedTask =
    taskModal.isOpen && taskModal.taskId
      ? boardTasks.find((task) => task.id === taskModal.taskId)
      : undefined

  const taskColumns = useMemo(
    () =>
      TASK_STATUSES.map((status) => ({
        status,
        label: TASK_STATUS_LABELS[status],
        tasks: boardTasks.filter((task) => task.status === status),
      })),
    [boardTasks],
  )

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id))
  }, [])

  const onDragCancel = useCallback(() => {
    setActiveTaskId(null)
  }, [])

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const activeId = String(event.active.id)
      const overId = event.over ? String(event.over.id) : null
      setActiveTaskId(null)

      if (!overId || activeId === overId) {
        return
      }

      const moveInstruction = resolveMoveInstruction(boardTasks, activeId, overId)
      if (!moveInstruction) {
        return
      }

      await moveTaskMutation({
        taskId: activeId as Id<'tasks'>,
        status: moveInstruction.status,
        index: moveInstruction.index,
      })
    },
    [boardTasks, moveTaskMutation],
  )

  const activeTask = useMemo(
    () => (activeTaskId ? boardTasks.find((task) => task.id === activeTaskId) : undefined),
    [activeTaskId, boardTasks],
  )

  const activeTaskAssignee = useMemo(
    () => members.find((member) => member.userId === activeTask?.assigneeId),
    [activeTask?.assigneeId, members],
  )

  const openCreateModal = () => {
    setTaskModal({
      isOpen: true,
      mode: 'create',
      taskId: null,
      defaultStatus: 'todo',
    })
  }

  const totalOpen =
    (project?.taskCounts.todo ?? 0) + (project?.taskCounts.in_progress ?? 0) + (project?.taskCounts.review ?? 0)

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
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsMembersModalOpen(true)}>
            Members
          </Button>
          <Button onClick={openCreateModal}>New Task</Button>
        </div>
      }
    >
      <section className="mb-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[var(--color-border)] bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]">
          Open tasks: {totalOpen}
        </span>
        <span className="rounded-full border border-[var(--color-border)] bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]">
          Members: {members.length}
        </span>
      </section>

      {board === undefined ? (
        <p className="rounded-2xl border border-[var(--color-border)] bg-white/70 px-4 py-6 text-sm text-[var(--color-subtle)]">
          Loading board...
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragCancel={onDragCancel}
          onDragEnd={(event) => void onDragEnd(event)}
        >
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {taskColumns.map((column, index) => (
                <div
                  key={column.status}
                  className="animate-column-in shrink-0"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <KanbanColumn
                    status={column.status}
                    title={column.label}
                    tasks={column.tasks}
                    members={members}
                    onTaskClick={(taskId) =>
                      setTaskModal({
                        isOpen: true,
                        mode: 'edit',
                        taskId,
                        defaultStatus: 'todo',
                      })
                    }
                    onQuickAdd={(status, title) =>
                      quickAddTaskMutation({
                        projectId: projectId as Id<'projects'>,
                        status,
                        title,
                      }).then(() => undefined)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeTask ? <TaskCardPreview task={activeTask} assignee={activeTaskAssignee} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <TaskModal
        isOpen={taskModal.isOpen}
        mode={taskModal.mode}
        projectId={projectId}
        defaultStatus={taskModal.defaultStatus}
        members={members}
        task={selectedTask}
        onClose={() => setTaskModal(DEFAULT_MODAL_STATE)}
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
        viewerRole={board?.viewerRole ?? 'member'}
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
