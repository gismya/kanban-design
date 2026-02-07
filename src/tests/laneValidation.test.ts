import { describe, expect, it } from 'vitest'
import type { ProjectLane } from '../types/domain'
import { normalizeLanesForSubmit, validateLaneNames } from '../lib/laneValidation'

describe('lane validation', () => {
  it('rejects empty lane names after trimming', () => {
    const lanes: ProjectLane[] = [
      { id: 'backlog', name: 'Backlog' },
      { id: 'todo', name: '   ' },
      { id: 'in_progress', name: 'In Progress' },
      { id: 'done', name: 'Done' },
    ]

    expect(validateLaneNames(lanes)).toBe('Lane name is required.')
  })

  it('rejects duplicate lane names using case and whitespace-insensitive matching', () => {
    const lanes: ProjectLane[] = [
      { id: 'backlog', name: 'Backlog' },
      { id: 'todo', name: 'To Do' },
      { id: 'in_progress', name: 'In Progress' },
      { id: 'review', name: '  to   do ' },
      { id: 'done', name: 'Done' },
    ]

    expect(validateLaneNames(lanes)).toBe('Lane name must be unique.')
  })

  it('normalizes lane names before submit', () => {
    const lanes: ProjectLane[] = [
      { id: 'review', name: '  QA   Ready  ' },
    ]

    expect(normalizeLanesForSubmit(lanes)).toEqual([{ id: 'review', name: 'QA Ready' }])
  })
})
