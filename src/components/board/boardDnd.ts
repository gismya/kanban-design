import type { Task, TaskStatus } from '../../types/domain'

export interface MoveInstruction {
  status: TaskStatus
  index: number
}

export function getColumnId(status: TaskStatus): string {
  return `column-${status}`
}

function parseColumnId(columnId: string): TaskStatus | null {
  const status = columnId.replace('column-', '') as TaskStatus
  if (!status || !columnId.startsWith('column-')) {
    return null
  }

  return status
}

export function resolveMoveInstruction(
  tasks: Task[],
  activeTaskId: string,
  overId: string,
): MoveInstruction | null {
  const activeTask = tasks.find((task) => task.id === activeTaskId)
  if (!activeTask) {
    return null
  }

  const maybeColumnStatus = parseColumnId(overId)
  if (maybeColumnStatus) {
    const destinationLength = tasks.filter((task) => task.status === maybeColumnStatus).length
    return {
      status: maybeColumnStatus,
      index: destinationLength,
    }
  }

  const overTask = tasks.find((task) => task.id === overId)
  if (!overTask) {
    return null
  }

  const sameStatusTasks = tasks.filter((task) => task.status === overTask.status)
  const index = sameStatusTasks.findIndex((task) => task.id === overTask.id)

  return {
    status: overTask.status,
    index: Math.max(index, 0),
  }
}
