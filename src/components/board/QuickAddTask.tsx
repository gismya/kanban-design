import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface QuickAddTaskProps {
  statusLabel: string
  disabled?: boolean
  onAdd: (title: string) => Promise<void>
}

export function QuickAddTask({ statusLabel, onAdd, disabled }: QuickAddTaskProps) {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    const normalized = title.trim()
    if (!normalized || isSubmitting || disabled) {
      return
    }

    setIsSubmitting(true)
    try {
      await onAdd(normalized)
      setTitle('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="mt-3 space-y-2 rounded-xl border border-dashed border-[var(--color-border)] bg-white/65 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Quick add task title"
        aria-label={`Quick add task to ${statusLabel}`}
        disabled={disabled || isSubmitting}
      />
      <Button type="submit" variant="ghost" className="w-full" disabled={!title.trim() || disabled || isSubmitting}>
        {isSubmitting ? 'Adding...' : `Add to ${statusLabel}`}
      </Button>
    </form>
  )
}
