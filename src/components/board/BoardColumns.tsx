import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core'
import { useMemo } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { TaskCardPreview } from './TaskCard'
import { useTaskBoardDnd } from '../../hooks/useTaskBoardDnd'
import type { Task, TaskStatus, User } from '../../types/domain'

export interface BoardColumnData {
  status: TaskStatus
  label: string
  tasks: Task[]
}

interface BoardColumnsProps {
  columns: BoardColumnData[]
  members: User[]
  onTaskClick: (taskId: string) => void
  onQuickAdd: (status: TaskStatus, title: string) => Promise<void>
  onMoveTask: (taskId: string, status: TaskStatus, index: number) => Promise<void>
}

export function BoardColumns({
  columns,
  members,
  onTaskClick,
  onQuickAdd,
  onMoveTask,
}: BoardColumnsProps) {
  const boardTasks = useMemo(() => columns.flatMap((column) => column.tasks), [columns])
  const laneIds = useMemo(() => columns.map((column) => column.status), [columns])

  const { activeTaskId, sensors, onDragStart, onDragCancel, onDragEnd } = useTaskBoardDnd({
    tasks: boardTasks,
    laneIds,
    onMoveTask,
  })

  const membersById = useMemo(() => new Map(members.map((member) => [member.userId, member])), [members])
  const activeTask = useMemo(
    () => (activeTaskId ? boardTasks.find((task) => task.id === activeTaskId) : undefined),
    [activeTaskId, boardTasks],
  )
  const activeTaskAssignee = activeTask?.assigneeId
    ? membersById.get(activeTask.assigneeId)
    : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragCancel={onDragCancel}
      onDragEnd={(event) => void onDragEnd(event)}
    >
      <div className="min-h-0 flex-1 -mx-4 overflow-x-auto overflow-y-visible px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex h-full min-h-0 min-w-full w-max gap-4 px-1">
          {columns.map((column, index) => (
            <div
              key={column.status}
              className="animate-column-in flex min-h-0 min-w-[18rem] flex-1 basis-0"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <KanbanColumn
                status={column.status}
                title={column.label}
                tasks={column.tasks}
                members={members}
                onTaskClick={onTaskClick}
                onQuickAdd={onQuickAdd}
              />
            </div>
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardPreview task={activeTask} assignee={activeTaskAssignee} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
