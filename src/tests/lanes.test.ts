import { describe, expect, it } from 'vitest'
import { normalizeLaneDrafts, resolveProjectLanes } from '../../convex/lib/lanes'
import { DEFAULT_PROJECT_LANES } from '../../convex/lib/validators'

describe('lane helpers', () => {
  it('normalizes valid lane drafts', () => {
    const lanes = normalizeLaneDrafts([
      { id: 'backlog', name: 'Backlog' },
      { id: 'todo', name: 'To Do' },
      { id: 'in_progress', name: 'In Progress' },
      { id: 'done', name: 'Done' },
    ])

    expect(lanes).toEqual([
      { id: 'backlog', name: 'Backlog' },
      { id: 'todo', name: 'To Do' },
      { id: 'in_progress', name: 'In Progress' },
      { id: 'done', name: 'Done' },
    ])
  })

  it('rejects missing core lanes', () => {
    expect(() =>
      normalizeLaneDrafts([
        { id: 'backlog', name: 'Backlog' },
        { id: 'todo', name: 'To Do' },
        { id: 'done', name: 'Done' },
      ]),
    ).toThrow(/in progress/i)
  })

  it('rejects renamed core lanes', () => {
    expect(() =>
      normalizeLaneDrafts([
        { id: 'backlog', name: 'Backlog' },
        { id: 'todo', name: 'To Do' },
        { id: 'in_progress', name: 'Working' },
        { id: 'done', name: 'Done' },
      ]),
    ).toThrow(/cannot be renamed/i)
  })

  it('falls back to default lanes for undefined or invalid project data', () => {
    expect(resolveProjectLanes(undefined)).toEqual(DEFAULT_PROJECT_LANES)

    expect(
      resolveProjectLanes([
        { id: 'backlog', name: 'Backlog' },
        { id: 'in_progress', name: 'Working' },
        { id: 'done', name: 'Done' },
      ] as never),
    ).toEqual(DEFAULT_PROJECT_LANES)
  })
})

