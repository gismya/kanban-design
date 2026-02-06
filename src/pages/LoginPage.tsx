import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

type AuthMode = 'signIn' | 'signUp'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuthActions()
  const ensureCurrentProfile = useMutation(api.users.ensureCurrentProfile)

  const [mode, setMode] = useState<AuthMode>('signIn')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result =
        mode === 'signUp'
          ? await signIn('password', { flow: 'signUp', email, password, name })
          : await signIn('password', { flow: 'signIn', email, password })

      if (result.signingIn) {
        await ensureCurrentProfile({ name: mode === 'signUp' ? name : undefined })
        navigate('/projects', { replace: true })
      }
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : 'Unable to authenticate. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(20,130,130,0.28),transparent_65%)] blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(3,105,161,0.22),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent-strong)]">
            Kanban Design Suite
          </p>
          <h1 className="font-display text-5xl leading-[1.05] text-[var(--color-ink)] sm:text-6xl">
            Team momentum,
            <br />
            live and reliable.
          </h1>
          <p className="mt-6 max-w-xl text-base text-[var(--color-subtle)]">
            Sign in with Convex Auth to manage real projects, real tasks, and role-based collaboration.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/80 p-4">
              <p className="font-display text-2xl text-[var(--color-ink)]">Realtime</p>
              <p className="mt-1 text-sm text-[var(--color-subtle)]">Board and project updates sync instantly.</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white/80 p-4">
              <p className="font-display text-2xl text-[var(--color-ink)]">Role-based</p>
              <p className="mt-1 text-sm text-[var(--color-subtle)]">Owner/Admin/Member permissions built in.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[0_20px_45px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-[var(--color-muted)] p-1">
            <Button
              className="flex-1"
              variant={mode === 'signIn' ? 'primary' : 'ghost'}
              onClick={() => setMode('signIn')}
              disabled={isSubmitting}
            >
              Sign In
            </Button>
            <Button
              className="flex-1"
              variant={mode === 'signUp' ? 'primary' : 'ghost'}
              onClick={() => setMode('signUp')}
              disabled={isSubmitting}
            >
              Create Account
            </Button>
          </div>

          <h2 className="font-display text-3xl">{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-sm text-[var(--color-subtle)]">
            {mode === 'signIn'
              ? 'Use your existing email and password to continue.'
              : 'Use email/password authentication backed by Convex Auth.'}
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            {mode === 'signUp' ? (
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]"
                  htmlFor="name"
                >
                  Full name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required={mode === 'signUp'}
                />
              </div>
            ) : null}

            <div>
              <label
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]"
                htmlFor="email"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]"
                htmlFor="password"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : mode === 'signIn' ? 'Continue to Projects' : 'Create Account'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  )
}
