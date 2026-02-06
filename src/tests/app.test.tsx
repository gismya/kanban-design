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
    void query
    return mockUseQuery(args)
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

  mockUseQuery.mockImplementation((args: unknown) => {
    if (
      typeof args === 'object' &&
      args !== null &&
      'projectId' in args
    ) {
      return {
        project: {
          id: 'project-1',
          name: 'Aurora Mobile',
          description: 'Mobile workspace',
          themeColor: '#129C99',
          taskCounts: { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 },
          viewerRole: 'member',
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
      }
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
    await user.click(screen.getAllByRole('button', { name: /^create project$/i })[1])

    await waitFor(() => {
      expect(mutationHandlerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Summit Ops',
          description: 'Operations workspace',
        }),
      )
    })
  })

  it('hides invite section for non-manager members in member modal', async () => {
    const user = userEvent.setup()
    mockAuthenticated(true)

    renderAppAt('/board/project-1')

    await user.click(screen.getByRole('button', { name: /members/i }))

    expect(screen.queryByText(/invite existing user/i)).not.toBeInTheDocument()
  })
})
