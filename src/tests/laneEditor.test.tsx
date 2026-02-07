import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LaneEditor } from '../components/projects/LaneEditor'
import type { ProjectLane } from '../types/domain'

const lanes: ProjectLane[] = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'To Do' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'done', name: 'Done' },
]

describe('LaneEditor', () => {
  it('blocks renaming a lane to an empty name after trimming', () => {
    const onChange = vi.fn()

    render(<LaneEditor lanes={lanes} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText(/lane name review/i), {
      target: { value: '    ' },
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('Lane name is required.')).toBeInTheDocument()
  })

  it('blocks renaming a lane to a duplicate name (case and whitespace insensitive)', () => {
    const onChange = vi.fn()

    render(<LaneEditor lanes={lanes} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText(/lane name review/i), {
      target: { value: '  to   do  ' },
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('Lane name must be unique.')).toBeInTheDocument()
  })

  it('normalizes lane rename input by trimming and collapsing whitespace', () => {
    const onChange = vi.fn()

    render(<LaneEditor lanes={lanes} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText(/lane name review/i), {
      target: { value: '  QA   Ready  ' },
    })

    expect(onChange).toHaveBeenCalledTimes(1)

    const nextLanes = onChange.mock.calls[0][0] as ProjectLane[]
    expect(nextLanes.find((lane) => lane.id === 'review')).toEqual({ id: 'review', name: 'QA Ready' })
    expect(screen.queryByText('Lane name must be unique.')).not.toBeInTheDocument()
  })
})
