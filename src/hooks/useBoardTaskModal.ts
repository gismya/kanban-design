import { useMemo, useState } from 'react'
import type { Task, TaskStatus } from '../types/domain'

type TaskModalMode = 'create' | 'edit'

interface TaskModalState {
  isOpen: boolean
  mode: TaskModalMode
  taskId: string | null
  defaultStatus: TaskStatus
}

const DEFAULT_TASK_MODAL_STATE: TaskModalState = {
  isOpen: false,
  mode: 'create',
  taskId: null,
  defaultStatus: 'todo',
}

function getDefaultCreateStatus(laneIds: string[]): TaskStatus {
  if (laneIds.includes('todo')) {
    return 'todo'
  }

  if (laneIds.includes('backlog')) {
    return 'backlog'
  }

  return laneIds[0] ?? 'backlog'
}

export function useBoardTaskModal(laneIds: string[], tasks: Task[]) {
  const [taskModal, setTaskModal] = useState<TaskModalState>(DEFAULT_TASK_MODAL_STATE)

  const selectedTask = useMemo(
    () =>
      taskModal.isOpen && taskModal.taskId
        ? tasks.find((task) => task.id === taskModal.taskId)
        : undefined,
    [taskModal.isOpen, taskModal.taskId, tasks],
  )

  const openCreateModal = () => {
    setTaskModal({
      isOpen: true,
      mode: 'create',
      taskId: null,
      defaultStatus: getDefaultCreateStatus(laneIds),
    })
  }

  const openEditModal = (taskId: string) => {
    setTaskModal({
      isOpen: true,
      mode: 'edit',
      taskId,
      defaultStatus: 'todo',
    })
  }

  const closeTaskModal = () => {
    setTaskModal(DEFAULT_TASK_MODAL_STATE)
  }

  return {
    taskModal,
    selectedTask,
    openCreateModal,
    openEditModal,
    closeTaskModal,
  }
}
