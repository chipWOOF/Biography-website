export type ActionKey = 'scan' | 'exploit' | 'defend' | 'counter'

export type AgentActionResult = 'success' | 'failure' | 'draw'

export interface AgentMemoryEntry {
  action: ActionKey
  result: AgentActionResult
}

export interface AgentMemory {
  recentActions: AgentMemoryEntry[]
  detectedPattern?: string
}

export interface Agent {
  id: string
  team: 'red' | 'blue'
  strategy: string
  successRate: number
  qTable?: number[][]
  memory?: AgentMemory
  learningRate: number
  discountFactor: number
  explorationRate: number
  capabilities: {
    attackPower: number
    defensePower: number
    stealth: number
    speed: number
  }
  restrictions: {
    maxActions: number
    cooldownTime: number
  }
}

export interface ScenarioComparisonResult {
  scenarioName: string
  redWinRate: number
  blueWinRate: number
  avgDamage: number
}
