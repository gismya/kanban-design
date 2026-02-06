import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import { AppShell } from '../components/layout/AppShell'
import { CreateProjectModal } from '../components/projects/CreateProjectModal'
import { ProjectCard } from '../components/projects/ProjectCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { Project } from '../types/domain'

type ProjectFilter = 'all' | 'active' | 'recent'

function matchesFilter(project: Project, filter: ProjectFilter): boolean {
  if (filter === 'all') {
    return true
  }

  if (filter === 'active') {
    return project.taskCounts.todo + project.taskCounts.in_progress + project.taskCounts.review > 0
  }

  return project.recentActivity?.toLowerCase().includes('updated') ?? false
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const { signOut } = useAuthActions()

  const ensureCurrentProfile = useMutation(api.users.ensureCurrentProfile)
  const createProject = useMutation(api.projects.createProject)
  const projects = useQuery(api.projects.listForCurrentUser)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    void ensureCurrentProfile({})
  }, [ensureCurrentProfile])

  const filteredProjects = useMemo(() => {
    const projectList = projects ?? []
    const query = search.trim().toLowerCase()

    return projectList.filter((project) => {
      const matchesSearch =
        !query ||
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)

      return matchesSearch && matchesFilter(project, filter)
    })
  }, [filter, projects, search])

  const openProject = (projectId: string) => {
    navigate(`/board/${projectId}`)
  }

  return (
    <AppShell
      title="Choose a Project"
      subtitle="Switch between initiatives and jump into the right board quickly."
      boardProjectId={(projects ?? [])[0]?.id ?? null}
      onLogout={signOut}
      actions={
        <Button onClick={() => setIsCreateModalOpen(true)}>
          New Project
        </Button>
      }
    >
      <section className="mb-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)] md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            className="md:max-w-sm"
          />

          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'recent'] as const).map((item) => (
              <Button
                key={item}
                variant={filter === item ? 'primary' : 'secondary'}
                onClick={() => setFilter(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {projects === undefined ? (
        <p className="rounded-3xl border border-[var(--color-border)] bg-white/75 px-4 py-6 text-sm text-[var(--color-subtle)]">
          Loading projects...
        </p>
      ) : null}

      {projects !== undefined && projects.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onOpen={openProject} />
          ))}
        </section>
      ) : null}

      {projects !== undefined && projects.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-[var(--color-border)] bg-white/75 p-8 text-center">
          <h3 className="font-display text-2xl text-[var(--color-ink)]">No projects yet</h3>
          <p className="mt-2 text-sm text-[var(--color-subtle)]">
            Start your workspace by creating the first project.
          </p>
          <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
            Create Project
          </Button>
        </section>
      ) : null}

      {projects !== undefined && projects.length > 0 && filteredProjects.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-white/70 px-4 py-6 text-center text-sm text-[var(--color-subtle)]">
          No projects match your current filters.
        </p>
      ) : null}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={async (input) => {
          const result = await createProject(input)
          setIsCreateModalOpen(false)
          navigate(`/board/${result.projectId}`)
        }}
      />
    </AppShell>
  )
}
