import { useState } from 'react'
import { ChartContainer } from '@/components/ui/chart'
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QValueSnapshot {
  /** Round this snapshot was taken */
  round: number
  /** agentId → max Q-value across all states */
  values: Record<string, number>
}

export interface ActionUsageSnapshot {
  /** Round this snapshot was taken */
  round: number
  /** actionKey → times chosen this round (across all agents) */
  counts: Record<string, number>
}

interface QLearningChartsProps {
  qValueHistory: QValueSnapshot[]
  actionUsageHistory: ActionUsageSnapshot[]
  /** All agent IDs — used to colour-code lines */
  agentIds: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_COLOURS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f97316',
  '#a855f7', '#06b6d4', '#eab308', '#ec4899',
]

const ACTION_COLOURS: Record<string, string> = {
  scan:    '#3b82f6',
  exploit: '#ef4444',
  defend:  '#22c55e',
  counter: '#f97316',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildCumulativeUsage = (history: ActionUsageSnapshot[]) => {
  const running: Record<string, number> = {}
  return history.map(snap => {
    Object.entries(snap.counts).forEach(([action, count]) => {
      running[action] = (running[action] ?? 0) + count
    })
    return { round: snap.round, ...running }
  })
}

const getUniqueActions = (history: ActionUsageSnapshot[]) =>
  Array.from(new Set(history.flatMap(s => Object.keys(s.counts))))

// ─── Component ────────────────────────────────────────────────────────────────

export function QLearningCharts({ qValueHistory, actionUsageHistory, agentIds }: QLearningChartsProps) {
  const [actionView, setActionView] = useState<'per-round' | 'cumulative'>('per-round')

  const hasData = qValueHistory.length > 0 && actionUsageHistory.length > 0

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Q-Learning Visualisation</CardTitle>
          <CardDescription>
            Run a simulation with Machine Learning enabled to populate Q-value and action usage charts.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // ── Q-value chart ──────────────────────────────────────────────────────────
  // Shape: [{ round: 1, red1: 0.4, blue1: 0.6, ... }, ...]
  const qChartData = qValueHistory.map(snap => ({
    round: snap.round,
    ...snap.values,
  }))

  const qChartConfig = Object.fromEntries(
    agentIds.map((id, i) => [
      id,
      { label: id, color: AGENT_COLOURS[i % AGENT_COLOURS.length] }
    ])
  )

  // ── Action usage chart ─────────────────────────────────────────────────────
  const actions = getUniqueActions(actionUsageHistory)

  const perRoundData = actionUsageHistory.map(snap => ({
    round: snap.round,
    ...snap.counts,
  }))

  const cumulativeData = buildCumulativeUsage(actionUsageHistory)

  const actionChartConfig = Object.fromEntries(
    actions.map(action => [
      action,
      {
        label: action.charAt(0).toUpperCase() + action.slice(1),
        color: ACTION_COLOURS[action] ?? '#888',
      }
    ])
  )

  const activeData = actionView === 'per-round' ? perRoundData : cumulativeData

  return (
    <div className="space-y-6">

      {/* ── Q-Value Evolution ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Q-Value Evolution</CardTitle>
          <CardDescription>
            Max Q-value per agent sampled across rounds. Rising values indicate stronger learned action preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={qChartConfig}>
            <LineChart data={qChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="round" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <Tooltip formatter={(v: number) => v.toFixed(3)} />
              <Legend />
              {agentIds.map((id, i) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  stroke={AGENT_COLOURS[i % AGENT_COLOURS.length]}
                  dot={false}
                  strokeWidth={1.5}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── Action Selection Frequency ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Action Selection Frequency</CardTitle>
              <CardDescription>
                How often each action was chosen —{' '}
                {actionView === 'per-round' ? 'per sampled round' : 'cumulative total'}.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={actionView === 'per-round' ? 'default' : 'outline'}
                onClick={() => setActionView('per-round')}
              >
                Per Round
              </Button>
              <Button
                size="sm"
                variant={actionView === 'cumulative' ? 'default' : 'outline'}
                onClick={() => setActionView('cumulative')}
              >
                Cumulative
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={actionChartConfig}>
            <BarChart data={activeData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="round" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {actions.map(action => (
                <Bar
                  key={action}
                  dataKey={action}
                  fill={ACTION_COLOURS[action] ?? '#888'}
                  name={action.charAt(0).toUpperCase() + action.slice(1)}
                  stackId="actions"
                />
              ))}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  )
}
