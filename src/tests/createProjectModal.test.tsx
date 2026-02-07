import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CreateProjectModal } from '../components/projects/CreateProjectModal'

describe('CreateProjectModal lane validation', () => {
  it('disables creating a project when any lane name is invalid', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn(async () => undefined)

    render(
      <CreateProjectModal isOpen onClose={() => undefined} onCreate={onCreate} />,
    )

    await user.type(screen.getByLabelText(/^name$/i), 'Example Project')
    await user.clear(screen.getByLabelText(/lane name todo/i))
    await user.type(screen.getByLabelText(/lane name todo/i), '   ')

    const createButton = screen.getByRole('button', { name: /^create project$/i })
    expect(createButton).toBeDisabled()
    expect(screen.getByText('Lane name is required.')).toBeInTheDocument()

    await user.click(createButton)
    expect(onCreate).not.toHaveBeenCalled()
  })
})
