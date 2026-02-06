import { useEffect, useState, type ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useConvexAuth } from 'convex/react'
import { BoardPage } from './pages/BoardPage'
import { LoginPage } from './pages/LoginPage'
import { ProjectsPage } from './pages/ProjectsPage'

const AUTH_LOADING_TIMEOUT_MS = 6000

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-sm text-[var(--color-subtle)]">
      Restoring session...
    </div>
  )
}

function AuthConnectionErrorScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Cannot reach backend</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-subtle)]">
          The app could not connect to your Convex deployment. Start the dev stack with
          <code className="mx-1 rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-xs text-[var(--color-text)]">
            npm run dev
          </code>
          and reload this page.
        </p>
        <button
          type="button"
          className="mt-6 rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    </div>
  )
}

function useAuthLoadingTimeout(isLoading: boolean) {
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    if (!isLoading || hasTimedOut) {
      return
    }

    const timeout = window.setTimeout(() => {
      setHasTimedOut(true)
    }, AUTH_LOADING_TIMEOUT_MS)

    return () => window.clearTimeout(timeout)
  }, [hasTimedOut, isLoading])

  return isLoading && hasTimedOut
}

function PrivateRoute({ children }: { children: ReactElement }) {
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />
  }

  return children
}

export function AppRoutes() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const hasTimedOut = useAuthLoadingTimeout(isLoading)

  if (hasTimedOut) {
    return <AuthConnectionErrorScreen />
  }

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/projects' : '/login'} replace />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <ProjectsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/:projectId"
        element={
          <PrivateRoute>
            <BoardPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/projects' : '/login'} replace />} />
    </Routes>
  )
}
