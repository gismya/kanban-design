import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from '../App'

const mockUseConvexAuth = vi.fn()
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

const signInMock = vi.fn()
const signOutMock = vi.fn()
const mutationHandlerMock = vi.fn(async (args: unknown) => {
  void args
  return {}
})

vi.mock('convex/react', () => ({
  useConvexAuth: () => mockUseConvexAuth(),
  useQuery: (query: unknown, args: unknown) => {
    return mockUseQuery(query, args)
  },
  useMutation: (mutation: unknown) => {
    void mutation
    return mockUseMutation()
  },
}))

vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({
    signIn: signInMock,
    signOut: signOutMock,
  }),
}))

function renderAppAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

function mockAuthenticated(authed: boolean) {
  mockUseConvexAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: authed,
  })
}

function buildBoardResponse(overrides?: Partial<Record<string, unknown>>) {
  return {
    project: {
      id: 'project-1',
      name: 'Aurora Mobile',
      description: 'Mobile workspace',
      themeColor: '#129C99',
      lanes: [
        { id: 'backlog', name: 'Backlog' },
        { id: 'todo', name: 'To Do' },
        { id: 'in_progress', name: 'In Progress' },
        { id: 'review', name: 'Review' },
        { id: 'done', name: 'Done' },
      ],
      taskCountsByLane: { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 },
      openTaskCount: 0,
      doneTaskCount: 0,
      totalTaskCount: 0,
      viewerRole: 'member',
      ...((overrides?.project as Record<string, unknown> | undefined) ?? {}),
    },
    tasks: [],
    members: [
      {
        userId: 'user-1',
        name: 'Elin Sandberg',
        email: 'elin@aurora.studio',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'member',
      },
    ],
    viewerRole: 'member',
    canManageMembers: false,
    canManageLanes: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()

  mutationHandlerMock.mockImplementation(async (args: unknown) => {
    if (
      typeof args === 'object' &&
      args !== null &&
      'name' in args &&
      'description' in args &&
      'themeColor' in args
    ) {
      return { projectId: 'project-1' }
    }

    return {}
  })

  mockUseMutation.mockImplementation(() => mutationHandlerMock)

  mockUseQuery.mockImplementation((_query: unknown, args: unknown) => {
    if (
      typeof args === 'object' &&
      args !== null &&
      'projectId' in args
    ) {
      return buildBoardResponse()
    }

    return []
  })

  signInMock.mockResolvedValue({ signingIn: true })
  signOutMock.mockResolvedValue(undefined)
})

describe('Kanban UI with Convex auth and data hooks', () => {
  it('redirects unauthenticated users from private routes to login', async () => {
    mockAuthenticated(false)

    renderAppAt('/projects')

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('redirects authenticated users from /login to /projects', async () => {
    mockAuthenticated(true)

    renderAppAt('/login')

    expect(await screen.findByRole('heading', { name: /choose a project/i })).toBeInTheDocument()
  })

  it('submits sign-up credentials through Convex auth', async () => {
    const user = userEvent.setup()
    mockAuthenticated(false)

    renderAppAt('/login')

    await user.click(screen.getByRole('button', { name: /create account/i }))
    await user.type(screen.getByLabelText(/full name/i), 'Alex Developer')
    await user.type(screen.getByLabelText(/^email$/i), 'alex@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getAllByRole('button', { name: /^create account$/i })[1])

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('password', {
        flow: 'signUp',
        email: 'alex@example.com',
        password: 'password123',
        name: 'Alex Developer',
      })
    })
  })

  it('creates a project from the projects page modal', async () => {
    const user = userEvent.setup()
    mockAuthenticated(true)

    renderAppAt('/projects')

    await user.click(screen.getByRole('button', { name: /^new project$/i }))
    await user.type(screen.getByLabelText(/^name$/i), 'Summit Ops')
    await user.type(screen.getByLabelText(/description/i), 'Operations workspace')
    await user.type(screen.getByLabelText(/new lane name/i), 'QA Ready')
    await user.click(screen.getByRole('button', { name: /^add lane$/i }))
    await user.click(screen.getAllByRole('button', { name: /^create project$/i })[1])

    await waitFor(() => {
      expect(mutationHandlerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Summit Ops',
          description: 'Operations workspace',
          lanes: expect.arrayContaining([
            expect.objectContaining({
              id: 'qa_ready',
              name: 'QA Ready',
            }),
          ]),
        }),
      )
    })
  })

  it('renders board columns in project lane order', async () => {
    mockUseQuery.mockImplementation((_query: unknown, args: unknown) => {
      if (typeof args === 'object' && args !== null && 'projectId' in args) {
        return buildBoardResponse({
          project: {
            lanes: [
              { id: 'backlog', name: 'Backlog' },
              { id: 'in_progress', name: 'In Progress' },
              { id: 'qa_ready', name: 'QA Ready' },
              { id: 'done', name: 'Done' },
            ],
          },
        })
      }

      return []
    })

    mockAuthenticated(true)
    renderAppAt('/board/project-1')

    const backlogColumn = await screen.findByTestId('column-backlog')
    const qaColumn = await screen.findByTestId('column-qa_ready')
    const doneColumn = await screen.findByTestId('column-done')

    expect(backlogColumn.compareDocumentPosition(qaColumn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(qaColumn.compareDocumentPosition(doneColumn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('prevents editing core lanes in the lane editor', async () => {
    const user = userEvent.setup()
    mockAuthenticated(true)

    renderAppAt('/projects')

    await user.click(screen.getByRole('button', { name: /^new project$/i }))

    expect(screen.getByLabelText(/lane name backlog/i)).toBeDisabled()
    expect(screen.getByLabelText(/lane name in_progress/i)).toBeDisabled()
    expect(screen.getByLabelText(/lane name done/i)).toBeDisabled()
    expect(screen.getAllByRole('button', { name: /^remove$/i })).toHaveLength(2)
  })

  it('requires removed-lane mapping when saving lane settings', async () => {
    const user = userEvent.setup()
    mockAuthenticated(true)

    mockUseQuery.mockImplementation((_query: unknown, args: unknown) => {
      if (typeof args === 'object' && args !== null && 'projectId' in args) {
        return {
          project: {
            id: 'project-1',
            name: 'Aurora Mobile',
            description: 'Mobile workspace',
            themeColor: '#129C99',
            lanes: [
              { id: 'backlog', name: 'Backlog' },
              { id: 'todo', name: 'To Do' },
              { id: 'in_progress', name: 'In Progress' },
              { id: 'review', name: 'Review' },
              { id: 'done', name: 'Done' },
            ],
            taskCountsByLane: { backlog: 0, todo: 0, in_progress: 0, review: 2, done: 0 },
            openTaskCount: 2,
            doneTaskCount: 0,
            totalTaskCount: 2,
            viewerRole: 'admin',
          },
          viewerRole: 'admin',
          canManageLanes: true,
        }
      }

      return []
    })

    renderAppAt('/projects/project-1/settings')

    await screen.findByLabelText(/lane name review/i)
    await user.click(screen.getAllByRole('button', { name: /^remove$/i })[1])
    await user.click(screen.getByRole('button', { name: /^save lanes$/i }))

    expect(mutationHandlerMock).not.toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: /map removed lanes/i })).toBeInTheDocument()
  })

  it('hides invite section for non-manager members in member modal', async () => {
    const user = userEvent.setup()
    mockAuthenticated(true)

    renderAppAt('/board/project-1')

    await user.click(screen.getByRole('button', { name: /members/i }))

    expect(screen.queryByText(/invite existing user/i)).not.toBeInTheDocument()
  })
})
