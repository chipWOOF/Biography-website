import { useCallback, useRef, useState } from 'react'

export type SimulationOutcome = 'red_win' | 'blue_win' | 'draw'

export interface SimulationAnalyticsInput {
  round: number
  outcome: SimulationOutcome
  redStrategy: string
  blueStrategy: string
}

export interface EvolutionDataPoint {
  round: number
  cumulativeRedWinRate: number
  cumulativeBlueWinRate: number
  cumulativeDrawRate: number
  redStrategy: string
  blueStrategy: string
}

export function useSimulationAnalytics() {
  const [evolutionData, setEvolutionData] = useState<EvolutionDataPoint[]>([])

  const counters = useRef({ redWins: 0, blueWins: 0, draws: 0, rounds: 0 })

  const appendRound = useCallback((input: SimulationAnalyticsInput) => {
    counters.current.rounds += 1

    if (input.outcome === 'red_win') {
      counters.current.redWins += 1
    } else if (input.outcome === 'blue_win') {
      counters.current.blueWins += 1
    } else {
      counters.current.draws += 1
    }

    const nextPoint: EvolutionDataPoint = {
      round: counters.current.rounds,
      cumulativeRedWinRate: counters.current.redWins / counters.current.rounds,
      cumulativeBlueWinRate: counters.current.blueWins / counters.current.rounds,
      cumulativeDrawRate: counters.current.draws / counters.current.rounds,
      redStrategy: input.redStrategy,
      blueStrategy: input.blueStrategy
    }

    setEvolutionData((current) => [...current, nextPoint])
  }, [])

  const resetAnalytics = useCallback(() => {
    counters.current = { redWins: 0, blueWins: 0, draws: 0, rounds: 0 }
    setEvolutionData([])
  }, [])

  return {
    evolutionData,
    appendRound,
    resetAnalytics
  }
}
