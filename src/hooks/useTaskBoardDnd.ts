import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useState } from 'react'
import type { Task, TaskStatus } from '../types/domain'
import { resolveMoveInstruction } from '../components/board/boardDnd'

interface UseTaskBoardDndOptions {
  tasks: Task[]
  laneIds: string[]
  onMoveTask: (taskId: string, status: TaskStatus, index: number) => Promise<void>
}

export function useTaskBoardDnd({ tasks, laneIds, onMoveTask }: UseTaskBoardDndOptions) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

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

      const moveInstruction = resolveMoveInstruction(tasks, activeId, overId, laneIds)
      if (!moveInstruction) {
        return
      }

      await onMoveTask(activeId, moveInstruction.status, moveInstruction.index)
    },
    [laneIds, onMoveTask, tasks],
  )

  return {
    activeTaskId,
    sensors,
    onDragStart,
    onDragCancel,
    onDragEnd,
  }
}
