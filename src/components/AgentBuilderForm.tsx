import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Agent } from '@/types/simulation'

interface AgentBuilderFormProps {
  onCreate: (agent: Omit<Agent, 'id'>) => void
}

interface FormState {
  team: 'red' | 'blue'
  strategy: string
  attackPower: number
  defensePower: number
  stealth: number
  speed: number
  learningRate: number
  discountFactor: number
  explorationRate: number
  maxActions: number
  cooldownTime: number
}

interface ValidationErrors {
  strategy?: string
  attackPower?: string
  defensePower?: string
  stealth?: string
  speed?: string
  learningRate?: string
  discountFactor?: string
  explorationRate?: string
  maxActions?: string
  cooldownTime?: string
}

const initialFormState: FormState = {
  team: 'red',
  strategy: 'custom-strategy',
  attackPower: 6,
  defensePower: 6,
  stealth: 6,
  speed: 6,
  learningRate: 0.1,
  discountFactor: 0.9,
  explorationRate: 0.2,
  maxActions: 5,
  cooldownTime: 2
}

const clampNumber = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

export function AgentBuilderForm({ onCreate }: AgentBuilderFormProps) {
  const [form, setForm] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const buildAgentPayload = useMemo(() => {
    const agentBase: Omit<Agent, 'id'> = {
      team: form.team,
      strategy: form.strategy.trim() || 'custom-strategy',
      successRate: 0,
      learningRate: form.learningRate,
      discountFactor: form.discountFactor,
      explorationRate: form.explorationRate,
      capabilities: {
        attackPower: form.attackPower,
        defensePower: form.defensePower,
        stealth: form.stealth,
        speed: form.speed
      },
      restrictions: {
        maxActions: form.maxActions,
        cooldownTime: form.cooldownTime
      },
      memory: {
        recentActions: []
      }
    }

    return agentBase
  }, [form])

  const validate = () => {
    const nextErrors: ValidationErrors = {}

    if (!form.strategy.trim()) {
      nextErrors.strategy = 'Strategy name is required.'
    }

    if (form.attackPower < 1 || form.attackPower > 10) {
      nextErrors.attackPower = 'Attack power must be between 1 and 10.'
    }
    if (form.defensePower < 1 || form.defensePower > 10) {
      nextErrors.defensePower = 'Defense power must be between 1 and 10.'
    }
    if (form.stealth < 1 || form.stealth > 10) {
      nextErrors.stealth = 'Stealth must be between 1 and 10.'
    }
    if (form.speed < 1 || form.speed > 10) {
      nextErrors.speed = 'Speed must be between 1 and 10.'
    }
    if (form.learningRate < 0 || form.learningRate > 1) {
      nextErrors.learningRate = 'Learning rate must be between 0 and 1.'
    }
    if (form.discountFactor < 0 || form.discountFactor > 1) {
      nextErrors.discountFactor = 'Discount factor must be between 0 and 1.'
    }
    if (form.explorationRate < 0 || form.explorationRate > 1) {
      nextErrors.explorationRate = 'Exploration rate must be between 0 and 1.'
    }
    if (form.maxActions < 1 || form.maxActions > 10) {
      nextErrors.maxActions = 'Max actions must be between 1 and 10.'
    }
    if (form.cooldownTime < 1 || form.cooldownTime > 10) {
      nextErrors.cooldownTime = 'Cooldown time must be between 1 and 10.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) return

    onCreate(buildAgentPayload)
    setForm(initialFormState)
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="agent-team">Team</Label>
          <Select
            value={form.team}
            onValueChange={(value) => setForm(prev => ({ ...prev, team: value as 'red' | 'blue' }))}
          >
            <SelectTrigger id="agent-team">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="red">Red Team</SelectItem>
              <SelectItem value="blue">Blue Team</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="agent-strategy">Strategy Name</Label>
          <Input
            id="agent-strategy"
            value={form.strategy}
            onChange={(event) => setForm(prev => ({ ...prev, strategy: event.target.value }))}
          />
          {errors.strategy ? <p className="text-xs text-red-600 mt-1">{errors.strategy}</p> : null}
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Create Agent</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { id: 'attackPower', label: 'Attack Power', value: form.attackPower, min: 1, max: 10 },
          { id: 'defensePower', label: 'Defense Power', value: form.defensePower, min: 1, max: 10 },
          { id: 'stealth', label: 'Stealth', value: form.stealth, min: 1, max: 10 },
          { id: 'speed', label: 'Speed', value: form.speed, min: 1, max: 10 }
        ].map((field) => (
          <div key={field.id}>
            <Label htmlFor={`agent-${field.id}`}>{field.label}</Label>
            <Input
              id={`agent-${field.id}`}
              type="number"
              value={field.value}
              min={field.min}
              max={field.max}
              onChange={(event) => setForm(prev => ({ ...prev, [field.id]: clampNumber(Number.parseInt(event.target.value, 10), field.min, field.max) }))}
            />
            {errors[field.id as keyof ValidationErrors] ? <p className="text-xs text-red-600 mt-1">{errors[field.id as keyof ValidationErrors]}</p> : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'learningRate', label: 'Learning Rate', value: form.learningRate, step: 0.01 },
          { id: 'discountFactor', label: 'Discount Factor', value: form.discountFactor, step: 0.01 },
          { id: 'explorationRate', label: 'Exploration Rate', value: form.explorationRate, step: 0.01 }
        ].map((field) => (
          <div key={field.id}>
            <Label htmlFor={`agent-${field.id}`}>{field.label}</Label>
            <Input
              id={`agent-${field.id}`}
              type="number"
              step={field.step}
              value={field.value}
              min={0}
              max={1}
              onChange={(event) => setForm(prev => ({ ...prev, [field.id]: clampNumber(Number.parseFloat(event.target.value), 0, 1) }))}
            />
            {errors[field.id as keyof ValidationErrors] ? <p className="text-xs text-red-600 mt-1">{errors[field.id as keyof ValidationErrors]}</p> : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="agent-max-actions">Max Actions</Label>
          <Input
            id="agent-max-actions"
            type="number"
            value={form.maxActions}
            min={1}
            max={10}
            onChange={(event) => setForm(prev => ({ ...prev, maxActions: clampNumber(Number.parseInt(event.target.value, 10), 1, 10) }))}
          />
          {errors.maxActions ? <p className="text-xs text-red-600 mt-1">{errors.maxActions}</p> : null}
        </div>
        <div>
          <Label htmlFor="agent-cooldown">Cooldown Time</Label>
          <Input
            id="agent-cooldown"
            type="number"
            value={form.cooldownTime}
            min={1}
            max={10}
            onChange={(event) => setForm(prev => ({ ...prev, cooldownTime: clampNumber(Number.parseInt(event.target.value, 10), 1, 10) }))}
          />
          {errors.cooldownTime ? <p className="text-xs text-red-600 mt-1">{errors.cooldownTime}</p> : null}
        </div>
      </div>
    </form>
  )
}
