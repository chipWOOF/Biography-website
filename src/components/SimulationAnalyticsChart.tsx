import { ChartContainer } from '@/components/ui/chart'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { EvolutionDataPoint } from '@/hooks/useSimulationAnalytics'

interface SimulationAnalyticsChartProps {
  data: EvolutionDataPoint[]
  className?: string
}

export function SimulationAnalyticsChart({ data, className }: SimulationAnalyticsChartProps) {
  return (
    <ChartContainer
      className={className}
      config={{
        cumulativeRedWinRate: { label: 'Red Win Rate', color: '#ef4444' },
        cumulativeBlueWinRate: { label: 'Blue Win Rate', color: '#2563eb' },
        cumulativeDrawRate: { label: 'Draw Rate', color: '#f59e0b' }
      }}
    >
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="round" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} />
        <Tooltip formatter={(value: number) => `${(value * 100).toFixed(0)}%`} />
        <Legend />
        <Line type="monotone" dataKey="cumulativeRedWinRate" stroke="#ef4444" dot={false} />
        <Line type="monotone" dataKey="cumulativeBlueWinRate" stroke="#2563eb" dot={false} />
        <Line type="monotone" dataKey="cumulativeDrawRate" stroke="#f59e0b" dot={false} />
      </LineChart>
    </ChartContainer>
  )
}
