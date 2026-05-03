import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChartContainer } from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useSimulationAnalytics } from '@/hooks/useSimulationAnalytics';
import { SimulationAnalyticsChart } from '@/components/SimulationAnalyticsChart';
import { Agent, ActionKey, Scenario, ScenarioComparisonResult } from '@/types/simulation';
import { AgentBuilderForm } from '@/components/AgentBuilderForm';
import { ScenarioBuilderForm } from '@/components/ScenarioBuilderForm';
import { RiskCard } from '@/components/RiskCard';
import { StatCard } from '@/components/StatCard';
import { InsightCard } from '@/components/InsightCard';
import { getReadableActionLabel } from '@/config/actionMappings';

const calculateRiskScore = (redWins: number, totalRounds: number, scenarioMultiplier: number) => {
  if (totalRounds === 0) return 0
  const score = (redWins / totalRounds) * scenarioMultiplier
  return Math.min(1, Math.max(0, score))
}

const getRiskLabel = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (score >= 0.6) return 'HIGH'
  if (score >= 0.3) return 'MEDIUM'
  return 'LOW'
}

const getRiskExplanation = (label: 'LOW' | 'MEDIUM' | 'HIGH') => {
  switch (label) {
    case 'HIGH':
      return 'Attack success is high relative to the current scenario risk profile.'
    case 'MEDIUM':
      return 'Moderate risk: defenders are challenged but still competitive.'
    default:
      return 'Low risk: defenders maintain strong control over the attack surface.'
  }
}

interface SecurityRecommendations {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  breachProbability: number;
  topThreats: string[];
  recommendedDefenses: string[];
  summary: string;
}

const generateSecurityRecommendations = (
  simulationResults: AttackResult[],
  agents: { red: Agent[]; blue: Agent[] },
  scenario: Scenario
): SecurityRecommendations => {
  if (simulationResults.length === 0) {
    return {
      riskLevel: 'LOW',
      breachProbability: 0,
      topThreats: [],
      recommendedDefenses: [],
      summary: 'No simulation data available'
    };
  }

  // Calculate breach probability
  const redWins = simulationResults.filter(r => r.outcome === 'red_win').length;
  const breachProbability = redWins / simulationResults.length;

  // Analyze attack strategies by success rate
  const attackStrategyStats = new Map<string, { wins: number; total: number }>();
  simulationResults.forEach(result => {
    const strategy = result.redStrategy;
    if (!attackStrategyStats.has(strategy)) {
      attackStrategyStats.set(strategy, { wins: 0, total: 0 });
    }
    const stats = attackStrategyStats.get(strategy)!;
    stats.total++;
    if (result.outcome === 'red_win') stats.wins++;
  });

  // Rank attack strategies by success rate
  const attackRankings = Array.from(attackStrategyStats.entries())
    .map(([strategy, stats]) => ({
      strategy,
      successRate: stats.wins / stats.total,
      totalAttempts: stats.total
    }))
    .sort((a, b) => b.successRate - a.successRate);

  // Map to real-world threat labels
  const threatMapping: Record<string, string> = {
    aggressive: 'SQL Injection / RCE',
    stealthy: 'Phishing / Social Engineering',
    persistent: 'APT / Advanced Persistent Threats',
    reactive: 'Zero-day Exploits'
  };

  const topThreats = attackRankings.slice(0, 3).map(ranking =>
    threatMapping[ranking.strategy] || ranking.strategy
  );

  // Analyze defense strategies by effectiveness
  const defenseStrategyStats = new Map<string, { wins: number; total: number }>();
  simulationResults.forEach(result => {
    const strategy = result.blueStrategy;
    if (!defenseStrategyStats.has(strategy)) {
      defenseStrategyStats.set(strategy, { wins: 0, total: 0 });
    }
    const stats = defenseStrategyStats.get(strategy)!;
    stats.total++;
    if (result.outcome === 'blue_win') stats.wins++;
  });

  // Rank defense strategies by win rate
  const defenseRankings = Array.from(defenseStrategyStats.entries())
    .map(([strategy, stats]) => ({
      strategy,
      winRate: stats.wins / stats.total,
      totalDefenses: stats.total
    }))
    .sort((a, b) => b.winRate - a.winRate);

  // Map to real-world defense labels
  const defenseMapping: Record<string, string> = {
    defensive: 'Multi-Factor Authentication (MFA)',
    reactive: 'SIEM / Intrusion Detection',
    proactive: 'Zero Trust Architecture',
    persistent: 'Active Defense / Honeypots'
  };

  const recommendedDefenses = defenseRankings.slice(0, 2).map(ranking =>
    defenseMapping[ranking.strategy] || ranking.strategy
  );

  // Determine risk level based on breach probability and scenario
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  const adjustedProbability = breachProbability * scenario.environment.systemVulnerability;

  if (adjustedProbability >= 0.6) riskLevel = 'HIGH';
  else if (adjustedProbability >= 0.3) riskLevel = 'MEDIUM';

  // Generate summary
  const summary = `Based on ${simulationResults.length} simulation rounds, the breach probability is ${(breachProbability * 100).toFixed(1)}%. ` +
    `${riskLevel === 'HIGH' ? 'High risk detected' : riskLevel === 'MEDIUM' ? 'Moderate risk identified' : 'Low risk environment'}. ` +
    `Top threats include ${topThreats.slice(0, 2).join(' and ')}. ` +
    `Recommended defenses: ${recommendedDefenses.join(' and ')}.`;

  return {
    riskLevel,
    breachProbability,
    topThreats,
    recommendedDefenses,
    summary
  };
};

interface Scenario {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  environment: {
    networkComplexity: number;
    userAwareness: number;
    systemVulnerability: number;
  };
}

interface ChoiceInfo {
  actionIndex: number;
  qValue?: number;
  exploration: boolean;
}

interface AttackResult {
  round: number;
  redAgent: string;
  blueAgent: string;
  scenario: string;
  redStrategy: string;
  blueStrategy: string;
  outcome: 'red_win' | 'blue_win' | 'draw';
  details: {
    redActions: string[];
    blueActions: string[];
    keyEvents: string[];
    duration: number;
    damage: number;
    redActionLabel: string;
    blueActionLabel: string;
    redChoiceReason: string;
    blueChoiceReason: string;
    redQValue?: number;
    blueQValue?: number;
  };
  rewards: {
    red: number;
    blue: number;
  };
}

interface WhatIfSummary {
  scenario: string;
  redWinRate: number;
  blueWinRate: number;
  drawRate: number;
  riskScore: number;
  riskLabel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const SecuritySimulation: React.FC = () => {
  const [redAgents, setRedAgents] = useState<Agent[]>([
    {
      id: 'red1',
      team: 'red',
      strategy: 'aggressive',
      successRate: 0,
      learningRate: 0.1,
      discountFactor: 0.9,
      explorationRate: 0.1,
      capabilities: { attackPower: 8, defensePower: 3, stealth: 6, speed: 7 },
      restrictions: { maxActions: 5, cooldownTime: 2 },
      memory: { recentActions: [] }
    },
    {
      id: 'red2',
      team: 'red',
      strategy: 'stealthy',
      successRate: 0,
      learningRate: 0.1,
      discountFactor: 0.9,
      explorationRate: 0.2,
      capabilities: { attackPower: 5, defensePower: 2, stealth: 9, speed: 8 },
      restrictions: { maxActions: 4, cooldownTime: 1 },
      memory: { recentActions: [] }
    },
    {
      id: 'red3',
      team: 'red',
      strategy: 'persistent',
      successRate: 0,
      learningRate: 0.15,
      discountFactor: 0.95,
      explorationRate: 0.05,
      capabilities: { attackPower: 6, defensePower: 4, stealth: 5, speed: 6 },
      restrictions: { maxActions: 7, cooldownTime: 3 },
      memory: { recentActions: [] }
    },
  ]);

  const [blueAgents, setBlueAgents] = useState<Agent[]>([
    {
      id: 'blue1',
      team: 'blue',
      strategy: 'defensive',
      successRate: 0,
      learningRate: 0.1,
      discountFactor: 0.9,
      explorationRate: 0.1,
      capabilities: { attackPower: 2, defensePower: 9, stealth: 4, speed: 5 },
      restrictions: { maxActions: 6, cooldownTime: 1 },
      memory: { recentActions: [] }
    },
    {
      id: 'blue2',
      team: 'blue',
      strategy: 'reactive',
      successRate: 0,
      learningRate: 0.1,
      discountFactor: 0.9,
      explorationRate: 0.15,
      capabilities: { attackPower: 3, defensePower: 7, stealth: 5, speed: 8 },
      restrictions: { maxActions: 5, cooldownTime: 2 },
      memory: { recentActions: [] }
    },
    {
      id: 'blue3',
      team: 'blue',
      strategy: 'proactive',
      successRate: 0,
      learningRate: 0.12,
      discountFactor: 0.92,
      explorationRate: 0.08,
      capabilities: { attackPower: 4, defensePower: 6, stealth: 6, speed: 7 },
      restrictions: { maxActions: 6, cooldownTime: 2 },
      memory: { recentActions: [] }
    },
  ]);

  const [scenarios] = useState<Scenario[]>([
    {
      name: 'Basic Network',
      description: 'Standard corporate network with moderate security',
      difficulty: 'easy',
      environment: { networkComplexity: 0.5, userAwareness: 0.6, systemVulnerability: 0.4 }
    },
    {
      name: 'Advanced Enterprise',
      description: 'Complex enterprise network with high security measures',
      difficulty: 'medium',
      environment: { networkComplexity: 0.8, userAwareness: 0.8, systemVulnerability: 0.3 }
    },
    {
      name: 'Critical Infrastructure',
      description: 'High-stakes critical infrastructure with maximum security',
      difficulty: 'hard',
      environment: { networkComplexity: 0.9, userAwareness: 0.9, systemVulnerability: 0.2 }
    }
  ]);

  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [customScenario, setCustomScenario] = useState<Scenario | null>(null);
  const [simulationResults, setSimulationResults] = useState<AttackResult[]>([]);
  const [strategyUsage, setStrategyUsage] = useState<{ red: Record<string, number>; blue: Record<string, number> }>({ red: {}, blue: {} });
  const [whatIfSummary, setWhatIfSummary] = useState<WhatIfSummary[]>([]);
  const [compareScenario, setCompareScenario] = useState<Scenario>(scenarios[1]);
  const [scenarioComparisonResults, setScenarioComparisonResults] = useState<ScenarioComparisonResult[]>([]);
  const [tournamentResults, setTournamentResults] = useState<{ redAgent: string; blueAgent: string; redWinRate: number; blueWinRate: number; draws: number }[]>([]);
  const [securityRecommendations, setSecurityRecommendations] = useState<SecurityRecommendations | null>(null);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const { evolutionData, appendRound, resetAnalytics } = useSimulationAnalytics();
  const [isRunning, setIsRunning] = useState(false);
  const [numRounds, setNumRounds] = useState(50);
  const [useML, setUseML] = useState(true);

  const actionKeys: ActionKey[] = ['scan', 'exploit', 'defend', 'counter'];
  const getActionDisplayLabel = (action: ActionKey) => getReadableActionLabel(action);

  const strategyLabels: Record<string, string> = {
    aggressive: 'Exploit Blitz',
    stealthy: 'Stealth Recon',
    persistent: 'APT Persistence',
    defensive: 'Defense in Depth',
    reactive: 'SIEM Response',
    proactive: 'Threat Hunting'
  };

  const createQTable = (numStates: number, numActions: number): number[][] => {
    return Array.from({ length: numStates }, () => Array(numActions).fill(0));
  };

  const updateQTable = (
    qTable: number[][],
    state: number,
    action: number,
    reward: number,
    nextState: number,
    learningRate: number,
    discountFactor: number
  ) => {
    const currentQ = qTable[state][action];
    const maxNextQ = Math.max(...qTable[nextState]);
    qTable[state][action] = currentQ + learningRate * (reward + discountFactor * maxNextQ - currentQ);
  };

  const getMemoryBias = (agent: Agent): Partial<Record<ActionKey, number>> => {
    const recentActions = agent.memory?.recentActions ?? [];
    const aggregate = recentActions.reduce((acc, entry) => {
      if (!acc[entry.action]) {
        acc[entry.action] = { success: 0, failure: 0, draw: 0 };
      }
      acc[entry.action][entry.result] += 1;
      return acc;
    }, {} as Record<ActionKey, { success: number; failure: number; draw: number }>);

    const bias: Partial<Record<ActionKey, number>> = {};
    const exploitStats = aggregate.exploit;
    if (exploitStats) {
      bias.exploit = Math.max(-0.4, -0.15 * exploitStats.failure);
    }

    const defendStats = aggregate.defend;
    if (defendStats) {
      bias.defend = Math.min(0.4, 0.15 * defendStats.success);
    }

    return bias;
  };

  const chooseAction = (
    qTable: number[][],
    state: number,
    explorationRate: number,
    memoryBias: Partial<Record<ActionKey, number>> = {}
  ): ChoiceInfo => {
    const row = qTable[state];
    const biasedValues = row.map((value, index) => value + (memoryBias[actionKeys[index]] ?? 0));

    if (Math.random() < explorationRate) {
      const weights = actionKeys.map((key, index) => Math.max(0.1, 1 + (memoryBias[key] ?? 0)));
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;
      let selected = 0;

      while (random > weights[selected] && selected < weights.length - 1) {
        random -= weights[selected];
        selected += 1;
      }

      return { actionIndex: selected, qValue: row[selected], exploration: true };
    }

    let bestIndex = 0;
    biasedValues.forEach((value, index) => {
      if (value > biasedValues[bestIndex]) {
        bestIndex = index;
      }
    });

    return { actionIndex: bestIndex, qValue: biasedValues[bestIndex], exploration: false };
  };

  const getChoiceReason = (choice: ChoiceInfo, actionLabel: string, agent: Agent) => {
    if (!choice.qValue && choice.qValue !== 0) {
      return `${actionLabel} was selected randomly by the control policy.`;
    }

    if (choice.exploration) {
      return `${actionLabel} was chosen for exploration with q=${choice.qValue.toFixed(2)} to test new behavior.`;
    }

    return `${actionLabel} was chosen because it had the highest q-value (${choice.qValue.toFixed(2)}) in the current state.`;
  };

  const buildStrategyUsage = (results: AttackResult[]) => {
    const red: Record<string, number> = {};
    const blue: Record<string, number> = {};

    results.forEach(result => {
      red[result.redStrategy] = (red[result.redStrategy] || 0) + 1;
      blue[result.blueStrategy] = (blue[result.blueStrategy] || 0) + 1;
    });

    return { red, blue };
  };

  const recordAgentMemory = (agent: Agent, action: ActionKey, outcome: 'success' | 'failure' | 'draw') => {
    const memory = agent.memory ?? { recentActions: [] };
    const recentActions = [...(memory.recentActions || []), { action, result: outcome }].slice(-5);
    const repeated = recentActions.filter(entry => entry.action === action).length;
    memory.recentActions = recentActions;
    memory.detectedPattern = repeated >= 3 ? `Detected repeated ${action} attempts` : undefined;
    agent.memory = memory;
  };

  const simulateDetailedRound = (
    redAgent: Agent,
    blueAgent: Agent,
    scenario: Scenario,
    round: number,
    redChoice: ChoiceInfo,
    blueChoice: ChoiceInfo,
    redChoiceReason: string,
    blueChoiceReason: string
  ): AttackResult => {
    const actions: ActionKey[] = actionKeys;
    let redActions: string[] = [];
    let blueActions: string[] = [];
    let keyEvents: string[] = [];
    let redScore = 0; // Track red's attack success
    let blueScore = 0; // Track blue's defense success
    let duration = Math.random() * 10 + 5; // 5-15 seconds

    // Normalize capabilities to 0-1 range
    const redAttackNorm = redAgent.capabilities.attackPower / 10;
    const redStealthNorm = redAgent.capabilities.stealth / 10;
    const blueDefenseNorm = blueAgent.capabilities.defensePower / 10;
    const blueCounterNorm = (blueAgent.capabilities.attackPower + blueAgent.capabilities.defensePower) / 20;

    const redAction = actions[redChoice.actionIndex] ?? 'scan';
    const blueAction = actions[blueChoice.actionIndex] ?? 'defend';
    const redActionLabel = getActionDisplayLabel(redAction);
    const blueActionLabel = getActionDisplayLabel(blueAction);

    for (let step = 0; step < Math.min(redAgent.restrictions.maxActions, blueAgent.restrictions.maxActions); step++) {
      redActions.push(redAction);
      blueActions.push(blueAction);

      // Action interactions
      if (redAction === 'exploit') {
        if (blueAction === 'defend') {
          const blockedDamage = redAttackNorm * (1 - blueDefenseNorm);
          redScore += Math.max(0, blockedDamage);
          blueScore += blueDefenseNorm * 5;
          keyEvents.push(`Red exploit blocked by blue defense (${(blockedDamage * 100).toFixed(0)}% got through)`);
        } else if (blueAction === 'counter') {
          const successChance = redStealthNorm > blueCounterNorm ? 0.6 : 0.3;
          if (Math.random() < successChance) {
            redScore += redAttackNorm * 8;
            keyEvents.push(`Red's exploit succeeded despite counter-attack!`);
          } else {
            blueScore += 6;
            keyEvents.push(`Blue's counter-attack thwarted the exploit`);
          }
        } else {
          redScore += redAttackNorm * 10;
          keyEvents.push(`Red's exploit succeeded! (${(redAttackNorm * 100).toFixed(0)}% damage)`);
        }
      } else if (redAction === 'scan') {
        if (blueAction === 'defend') {
          blueScore += blueDefenseNorm * 3;
          keyEvents.push(`Blue detected red's scan (IP logged)`);
        } else if (blueAction === 'counter') {
          blueScore += blueCounterNorm * 7;
          keyEvents.push(`Blue counter-attacked during red's scan`);
        } else {
          redScore += redStealthNorm * 4;
          keyEvents.push(`Red mapped network during scan (${redStealthNorm * 40}% undetected)`);
        }
      } else if (redAction === 'defend') {
        if (blueAction === 'exploit') {
          redScore += 2;
          blueScore -= 3;
          keyEvents.push(`Red defended against blue's exploit (partially)`);
        } else {
          redScore += 1;
          keyEvents.push(`Red reinforced defenses`);
        }
      } else if (redAction === 'counter') {
        if (blueAction === 'exploit') {
          const counterSuccess = redStealthNorm > 0.5 ? 0.7 : 0.4;
          if (Math.random() < counterSuccess) {
            redScore += 7;
            keyEvents.push(`Red's counter-attack stopped blue's exploit!`);
          } else {
            blueScore += 5;
            keyEvents.push(`Red's counter failed, blue's exploit landed`);
          }
        }
      }
    }

    // Apply scenario multiplier
    const scenarioMult = 1 + (scenario.environment.systemVulnerability * 0.5) - (scenario.environment.userAwareness * 0.3);
    redScore *= scenarioMult;
    blueScore *= scenarioMult;

    let outcome: 'red_win' | 'blue_win' | 'draw';
    let redReward = 0;
    let blueReward = 0;
    const scoreDiff = redScore - blueScore;

    if (scoreDiff > 15) {
      outcome = 'red_win';
      redReward = 10;
      blueReward = -5;
    } else if (scoreDiff < -15) {
      outcome = 'blue_win';
      redReward = -5;
      blueReward = 10;
    } else {
      outcome = 'draw';
      redReward = 2;
      blueReward = 2;
    }

    return {
      round,
      redAgent: redAgent.id,
      blueAgent: blueAgent.id,
      scenario: scenario.name,
      redStrategy: redAgent.strategy,
      blueStrategy: blueAgent.strategy,
      outcome,
      details: {
        redActions,
        blueActions,
        keyEvents,
        duration,
        damage: Number(scoreDiff.toFixed(2)),
        redActionLabel,
        blueActionLabel,
        redChoiceReason,
        blueChoiceReason,
        redQValue: redChoice.qValue,
        blueQValue: blueChoice.qValue
      },
      rewards: {
        red: redReward,
        blue: blueReward
      }
    };
  };

  useEffect(() => {
    if (!useML) return;

    setRedAgents(prev => prev.map(agent => ({
      ...agent,
      qTable: agent.qTable ?? createQTable(10, 4)
    })));

    setBlueAgents(prev => prev.map(agent => ({
      ...agent,
      qTable: agent.qTable ?? createQTable(10, 4)
    })));
  }, [useML]);

  const runSimulation = async () => {
    setIsRunning(true);
    setSimulationResults([]);

    const localResults: AttackResult[] = [];
    const localRedAgents = redAgents.map(agent => ({
      ...agent,
      qTable: agent.qTable ? agent.qTable.map(row => [...row]) : undefined,
      memory: agent.memory ? { ...agent.memory, recentActions: [...agent.memory.recentActions] } : undefined
    }));
    const localBlueAgents = blueAgents.map(agent => ({
      ...agent,
      qTable: agent.qTable ? agent.qTable.map(row => [...row]) : undefined,
      memory: agent.memory ? { ...agent.memory, recentActions: [...agent.memory.recentActions] } : undefined
    }));

    resetAnalytics()

    for (let round = 0; round < numRounds; round++) {
      const redIndex = Math.floor(Math.random() * localRedAgents.length);
      const blueIndex = Math.floor(Math.random() * localBlueAgents.length);
      const redAgent = localRedAgents[redIndex];
      const blueAgent = localBlueAgents[blueIndex];

      const state = Math.floor(Math.random() * 10);
      const nextState = Math.floor(Math.random() * 10);

      const redMemoryBias = getMemoryBias(redAgent);
      const blueMemoryBias = getMemoryBias(blueAgent);

      const redChoice = useML && redAgent.qTable
        ? chooseAction(redAgent.qTable, state, redAgent.explorationRate, redMemoryBias)
        : { actionIndex: Math.floor(Math.random() * actionKeys.length), exploration: false };
      const blueChoice = useML && blueAgent.qTable
        ? chooseAction(blueAgent.qTable, state, blueAgent.explorationRate, blueMemoryBias)
        : { actionIndex: Math.floor(Math.random() * actionKeys.length), exploration: false };

      const redAction = actionKeys[redChoice.actionIndex];
      const blueAction = actionKeys[blueChoice.actionIndex];
      const redActionLabel = getActionDisplayLabel(redAction) ?? 'Unknown Attack';
      const blueActionLabel = getActionDisplayLabel(blueAction) ?? 'Unknown Defense';
      const redChoiceReason = getChoiceReason(redChoice, redActionLabel, redAgent);
      const blueChoiceReason = getChoiceReason(blueChoice, blueActionLabel, blueAgent);

      const result = simulateDetailedRound(
        redAgent,
        blueAgent,
        selectedScenario,
        round + 1,
        redChoice,
        blueChoice,
        redChoiceReason,
        blueChoiceReason
      );

      const redOutcome = result.outcome === 'red_win' ? 'success' : result.outcome === 'blue_win' ? 'failure' : 'draw';
      const blueOutcome = result.outcome === 'blue_win' ? 'success' : result.outcome === 'red_win' ? 'failure' : 'draw';
      recordAgentMemory(redAgent, redAction, redOutcome);
      recordAgentMemory(blueAgent, blueAction, blueOutcome);

      localResults.push(result);
      appendRound(result);

      if (useML && redAgent.qTable) {
        updateQTable(redAgent.qTable, state, redChoice.actionIndex, result.rewards.red, nextState, redAgent.learningRate, redAgent.discountFactor);
      }
      if (useML && blueAgent.qTable) {
        updateQTable(blueAgent.qTable, state, blueChoice.actionIndex, result.rewards.blue, nextState, blueAgent.learningRate, blueAgent.discountFactor);
      }
    }

    localRedAgents.forEach(agent => {
      const agentRounds = localResults.filter(r => r.redAgent === agent.id);
      agent.successRate = agentRounds.length ? agentRounds.filter(r => r.outcome === 'red_win').length / agentRounds.length : 0;
    });

    localBlueAgents.forEach(agent => {
      const agentRounds = localResults.filter(r => r.blueAgent === agent.id);
      agent.successRate = agentRounds.length ? agentRounds.filter(r => r.outcome === 'blue_win').length / agentRounds.length : 0;
    });

    setStrategyUsage(buildStrategyUsage(localResults));
    setPlaybackIndex(0);

    setRedAgents(localRedAgents);
    setBlueAgents(localBlueAgents);
    setSimulationResults(localResults);
    setSecurityRecommendations(generateSecurityRecommendations(localResults, { red: localRedAgents, blue: localBlueAgents }, selectedScenario));
    setIsRunning(false);
  };

  const getSummaryStats = () => {
    if (simulationResults.length === 0) return null;

    const redWins = simulationResults.filter(r => r.outcome === 'red_win').length;
    const blueWins = simulationResults.filter(r => r.outcome === 'blue_win').length;
    const draws = simulationResults.filter(r => r.outcome === 'draw').length;

    const bestRedStrategy = redAgents.reduce((best, agent) =>
      agent.successRate > best.successRate ? agent : best
    );

    const bestBlueStrategy = blueAgents.reduce((best, agent) =>
      agent.successRate > best.successRate ? agent : best
    );

    const avgDamage = simulationResults.reduce((sum, r) => sum + r.details.damage, 0) / simulationResults.length;

    return {
      totalRounds: simulationResults.length,
      redWins,
      blueWins,
      draws,
      bestRedStrategy: bestRedStrategy.strategy,
      bestBlueStrategy: bestBlueStrategy.strategy,
      avgDamage: avgDamage.toFixed(2),
      redWinRate: ((redWins / simulationResults.length) * 100).toFixed(1),
      blueWinRate: ((blueWins / simulationResults.length) * 100).toFixed(1)
    };
  };

  const simulateScenario = (scenario: Scenario) => {
    const localResults: AttackResult[] = [];
    const localRedAgents = redAgents.map(agent => ({
      ...agent,
      qTable: agent.qTable ? agent.qTable.map(row => [...row]) : undefined,
      memory: agent.memory ? { ...agent.memory, recentActions: [...agent.memory.recentActions] } : undefined
    }));
    const localBlueAgents = blueAgents.map(agent => ({
      ...agent,
      qTable: agent.qTable ? agent.qTable.map(row => [...row]) : undefined,
      memory: agent.memory ? { ...agent.memory, recentActions: [...agent.memory.recentActions] } : undefined
    }));

    for (let round = 0; round < numRounds; round++) {
      const redAgent = localRedAgents[Math.floor(Math.random() * localRedAgents.length)];
      const blueAgent = localBlueAgents[Math.floor(Math.random() * localBlueAgents.length)];
      const state = Math.floor(Math.random() * 10);
      const nextState = Math.floor(Math.random() * 10);
      const redMemoryBias = getMemoryBias(redAgent);
      const blueMemoryBias = getMemoryBias(blueAgent);

      const redChoice = useML && redAgent.qTable
        ? chooseAction(redAgent.qTable, state, redAgent.explorationRate, redMemoryBias)
        : { actionIndex: Math.floor(Math.random() * actionKeys.length), exploration: false };
      const blueChoice = useML && blueAgent.qTable
        ? chooseAction(blueAgent.qTable, state, blueAgent.explorationRate, blueMemoryBias)
        : { actionIndex: Math.floor(Math.random() * actionKeys.length), exploration: false };
      const redAction = actionKeys[redChoice.actionIndex];
      const blueAction = actionKeys[blueChoice.actionIndex];
      const redActionLabel = getActionDisplayLabel(redAction) ?? 'Unknown Attack';
      const blueActionLabel = getActionDisplayLabel(blueAction) ?? 'Unknown Defense';
      const redChoiceReason = getChoiceReason(redChoice, redActionLabel, redAgent);
      const blueChoiceReason = getChoiceReason(blueChoice, blueActionLabel, blueAgent);
      const result = simulateDetailedRound(
        redAgent,
        blueAgent,
        scenario,
        round + 1,
        redChoice,
        blueChoice,
        redChoiceReason,
        blueChoiceReason
      );

      const redOutcome = result.outcome === 'red_win' ? 'success' : result.outcome === 'blue_win' ? 'failure' : 'draw';
      const blueOutcome = result.outcome === 'blue_win' ? 'success' : result.outcome === 'red_win' ? 'failure' : 'draw';
      recordAgentMemory(redAgent, redAction, redOutcome);
      recordAgentMemory(blueAgent, blueAction, blueOutcome);

      localResults.push(result);
      if (useML && redAgent.qTable) {
        updateQTable(redAgent.qTable, state, redChoice.actionIndex, result.rewards.red, nextState, redAgent.learningRate, redAgent.discountFactor);
      }
      if (useML && blueAgent.qTable) {
        updateQTable(blueAgent.qTable, state, blueChoice.actionIndex, result.rewards.blue, nextState, blueAgent.learningRate, blueAgent.discountFactor);
      }
    }

    const redWins = localResults.filter(r => r.outcome === 'red_win').length;
    const blueWins = localResults.filter(r => r.outcome === 'blue_win').length;
    const drawCount = localResults.filter(r => r.outcome === 'draw').length;
    const avgDamage = localResults.reduce((sum, r) => sum + r.details.damage, 0) / localResults.length;
    const score = calculateRiskScore(redWins, localResults.length, scenario.environment.systemVulnerability);

    return {
      scenario: scenario.name,
      redWinRate: (redWins / localResults.length) * 100,
      blueWinRate: (blueWins / localResults.length) * 100,
      drawRate: (drawCount / localResults.length) * 100,
      avgDamage,
      riskScore: score,
      riskLabel: getRiskLabel(score)
    };
  };

  const runScenarioComparisons = () => {
    const results = scenarios.map((scenario) => {
      const summary = simulateScenario(scenario);
      return {
        scenarioName: summary.scenario,
        redWinRate: summary.redWinRate,
        blueWinRate: summary.blueWinRate,
        avgDamage: summary.avgDamage
      };
    });

    setScenarioComparisonResults(results);
  };

  const runTournament = () => {
    const results: { redAgent: string; blueAgent: string; redWinRate: number; blueWinRate: number; draws: number }[] = [];
    const numRounds = 100; // Fixed number of rounds per matchup for consistency

    for (const redAgent of redAgents) {
      for (const blueAgent of blueAgents) {
        let redWins = 0;
        let blueWins = 0;
        let draws = 0;

        for (let round = 0; round < numRounds; round++) {
          const state = Math.floor(Math.random() * 10);
          const nextState = Math.floor(Math.random() * 10);
          const redMemoryBias = getMemoryBias(redAgent);
          const blueMemoryBias = getMemoryBias(blueAgent);

          const redChoice = redAgent.qTable && useML
            ? chooseAction(redAgent.qTable, state, redAgent.explorationRate, redMemoryBias)
            : { actionIndex: Math.floor(Math.random() * actionKeys.length), exploration: false };
          const blueChoice = blueAgent.qTable && useML
            ? chooseAction(blueAgent.qTable, state, blueAgent.explorationRate, blueMemoryBias)
            : { actionIndex: Math.floor(Math.random() * actionKeys.length), exploration: false };

          const redAction = actionKeys[redChoice.actionIndex];
          const blueAction = actionKeys[blueChoice.actionIndex];
          const redActionLabel = getActionDisplayLabel(redAction) ?? 'Unknown Attack';
          const blueActionLabel = getActionDisplayLabel(blueAction) ?? 'Unknown Defense';
          const redChoiceReason = getChoiceReason(redChoice, redActionLabel, redAgent);
          const blueChoiceReason = getChoiceReason(blueChoice, blueActionLabel, blueAgent);

          const result = simulateDetailedRound(
            redAgent,
            blueAgent,
            selectedScenario,
            round + 1,
            redChoice,
            blueChoice,
            redChoiceReason,
            blueChoiceReason
          );

          if (result.outcome === 'red_win') redWins++;
          else if (result.outcome === 'blue_win') blueWins++;
          else draws++;
        }

        results.push({
          redAgent: `${redAgent.strategy} (${redAgent.id})`,
          blueAgent: `${blueAgent.strategy} (${blueAgent.id})`,
          redWinRate: (redWins / numRounds) * 100,
          blueWinRate: (blueWins / numRounds) * 100,
          draws: (draws / numRounds) * 100
        });
      }
    }

    setTournamentResults(results);
  };

  const runWhatIfAnalysis = () => {
    setWhatIfSummary([
      simulateScenario(selectedScenario),
      simulateScenario(compareScenario)
    ]);
  };

  const exportResultsJSON = () => {
    const blob = new Blob([JSON.stringify(simulationResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportResultsCSV = () => {
    const header = ['round,scenario,redAgent,blueAgent,redStrategy,blueStrategy,outcome,damage,redAction,blueAction,redChoiceReason,blueChoiceReason'];
    const rows = simulationResults.map(result => [
      result.round,
      result.scenario,
      result.redAgent,
      result.blueAgent,
      result.redStrategy,
      result.blueStrategy,
      result.outcome,
      result.details.damage,
      result.details.redActionLabel,
      result.details.blueActionLabel,
      result.details.redChoiceReason,
      result.details.blueChoiceReason
    ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([header.concat(rows).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateAgentId = useCallback((team: 'red' | 'blue') => {
    const existingIds = new Set([...redAgents, ...blueAgents].map(agent => agent.id));
    let candidate = '';

    do {
      const randomSuffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().split('-')[0]
        : Math.random().toString(36).slice(2, 10);
      candidate = `${team}-${randomSuffix}`;
    } while (existingIds.has(candidate));

    return candidate;
  }, [redAgents, blueAgents]);

  const handleCreateAgent = (agentPayload: Omit<Agent, 'id'>) => {
    const id = generateAgentId(agentPayload.team);
    const newAgent: Agent = {
      id,
      ...agentPayload,
      qTable: useML ? createQTable(10, 4) : undefined,
      memory: { recentActions: [] }
    };

    if (newAgent.team === 'red') {
      setRedAgents(prev => [...prev, newAgent]);
    } else {
      setBlueAgents(prev => [...prev, newAgent]);
    }
  };

  const handleRemoveAgent = (agentId: string, team: 'red' | 'blue') => {
    if (team === 'red') {
      setRedAgents(prev => prev.filter(agent => agent.id !== agentId));
    } else {
      setBlueAgents(prev => prev.filter(agent => agent.id !== agentId));
    }
  };

  const stats = getSummaryStats();
  const risk = simulationResults.length > 0
    ? (() => {
        const redWins = simulationResults.filter(r => r.outcome === 'red_win').length;
        const score = calculateRiskScore(redWins, simulationResults.length, selectedScenario.environment.systemVulnerability);
        const label = getRiskLabel(score);

        return {
          score,
          label,
          explanation: getRiskExplanation(label)
        };
      })()
    : null;

  const strategyUsageData = useMemo(() => {
    const allStrategies = new Set<string>([
      ...Object.keys(strategyUsage.red),
      ...Object.keys(strategyUsage.blue)
    ]);

    return Array.from(allStrategies).map(strategy => ({
      strategy,
      redCount: strategyUsage.red[strategy] || 0,
      blueCount: strategyUsage.blue[strategy] || 0
    }));
  }, [strategyUsage]);

  const playbackResult = simulationResults[playbackIndex];

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Advanced AI Security Simulation</h1>
        <Link to="/">
          <Button variant="outline">
            ← Back to Home
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="simulation" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="agents">Agent Config</TabsTrigger>
          <TabsTrigger value="create-agent">Create Agent</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tournament">Tournament</TabsTrigger>
        </TabsList>

        <TabsContent value="simulation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="scenario">Scenario</Label>
                  <Select value={selectedScenario.name} onValueChange={(value) =>
                    setSelectedScenario(scenarios.find(s => s.name === value) || scenarios[0])
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map(scenario => (
                        <SelectItem key={scenario.name} value={scenario.name}>
                          {scenario.name} ({scenario.difficulty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rounds">Number of Rounds</Label>
                  <Input
                    id="rounds"
                    type="number"
                    value={numRounds}
                    onChange={(e) => {
                      const parsed = Number.parseInt(e.target.value, 10);
                      setNumRounds(Number.isFinite(parsed) ? Math.max(10, Math.min(500, parsed)) : 10);
                    }}
                    min="10"
                    max="500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ml"
                    checked={useML}
                    onChange={(e) => setUseML(e.target.checked)}
                  />
                  <Label htmlFor="ml">Enable Machine Learning</Label>
                </div>
              </div>
              <Button onClick={runSimulation} disabled={isRunning} className="w-full">
                {isRunning ? 'Running Simulation...' : `Run ${numRounds} Rounds`}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Scenario: {selectedScenario.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{selectedScenario.description}</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>Network Complexity: {(selectedScenario.environment.networkComplexity * 100).toFixed(0)}%</div>
                <div>User Awareness: {(selectedScenario.environment.userAwareness * 100).toFixed(0)}%</div>
                <div>System Vulnerability: {(selectedScenario.environment.systemVulnerability * 100).toFixed(0)}%</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Red Team (Attackers)</CardTitle>
              </CardHeader>
              <CardContent>
                {redAgents.map(agent => (
                  <div key={agent.id} className="mb-4 p-4 border rounded">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{agent.strategy} - Success: {agent.successRate.toFixed(2)}</h4>
                        <div className="text-xs text-gray-500">ID: {agent.id}</div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveAgent(agent.id, 'red')}>
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>Attack: {agent.capabilities.attackPower}</div>
                      <div>Defense: {agent.capabilities.defensePower}</div>
                      <div>Stealth: {agent.capabilities.stealth}</div>
                      <div>Speed: {agent.capabilities.speed}</div>
                    </div>
                    <div className="text-xs mt-2">
                      Max Actions: {agent.restrictions.maxActions}, Cooldown: {agent.restrictions.cooldownTime}s
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blue Team (Defenders)</CardTitle>
              </CardHeader>
              <CardContent>
                {blueAgents.map(agent => (
                  <div key={agent.id} className="mb-4 p-4 border rounded">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{agent.strategy} - Success: {agent.successRate.toFixed(2)}</h4>
                        <div className="text-xs text-gray-500">ID: {agent.id}</div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveAgent(agent.id, 'blue')}>
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>Attack: {agent.capabilities.attackPower}</div>
                      <div>Defense: {agent.capabilities.defensePower}</div>
                      <div>Stealth: {agent.capabilities.stealth}</div>
                      <div>Speed: {agent.capabilities.speed}</div>
                    </div>
                    <div className="text-xs mt-2">
                      Max Actions: {agent.restrictions.maxActions}, Cooldown: {agent.restrictions.cooldownTime}s
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        <TabsContent value="create-agent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentBuilderForm onCreate={handleCreateAgent} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning & Win Rate Evolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <SimulationAnalyticsChart data={evolutionData} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Playback & Export</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Button onClick={exportResultsJSON} disabled={simulationResults.length === 0}>Export JSON</Button>
                <Button onClick={exportResultsCSV} disabled={simulationResults.length === 0}>Export CSV</Button>
              </div>
              {playbackResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Playback Round {playbackResult.round}</h4>
                    <div className="space-x-2">
                      <Button onClick={() => setPlaybackIndex(Math.max(0, playbackIndex - 1))} disabled={playbackIndex === 0}>Previous</Button>
                      <Button onClick={() => setPlaybackIndex(Math.min(simulationResults.length - 1, playbackIndex + 1))} disabled={playbackIndex === simulationResults.length - 1}>Next</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 border rounded">
                      <p><strong>Red:</strong> {playbackResult.redStrategy}</p>
                      <p>{playbackResult.details.redActionLabel}</p>
                      <p>{playbackResult.details.redChoiceReason}</p>
                    </div>
                    <div className="p-4 border rounded">
                      <p><strong>Blue:</strong> {playbackResult.blueStrategy}</p>
                      <p>{playbackResult.details.blueActionLabel}</p>
                      <p>{playbackResult.details.blueChoiceReason}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Run a simulation to enable round playback.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Attack Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-4">
                {simulationResults.slice(-20).map((result, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Round {result.round}</h4>
                      <Badge variant={
                        result.outcome === 'red_win' ? 'destructive' :
                        result.outcome === 'blue_win' ? 'default' : 'secondary'
                      }>
                        {result.outcome.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Red ({strategyLabels[result.redStrategy] ?? result.redStrategy}):</strong> {result.details.redActions.join(', ')}
                      </div>
                      <div>
                        <strong>Blue ({strategyLabels[result.blueStrategy] ?? result.blueStrategy}):</strong> {result.details.blueActions.join(', ')}
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <strong>Key Events:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {result.details.keyEvents.map((event, i) => (
                          <li key={i}>{event}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Duration: {result.details.duration.toFixed(1)}s | Damage: {result.details.damage.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>Total Rounds: {stats.totalRounds}</div>
                  <div>Red Team Wins: {stats.redWins} ({stats.redWinRate}%)</div>
                  <div>Blue Team Wins: {stats.blueWins} ({stats.blueWinRate}%)</div>
                  <div>Draws: {stats.draws}</div>
                  <div>Average Damage: {stats.avgDamage}</div>
                  {risk && (
                    <div className="space-y-3">
                      <div>
                        Security Risk Score: <Badge variant={risk.label === 'HIGH' ? 'destructive' : risk.label === 'MEDIUM' ? 'secondary' : 'default'}>{risk.label}</Badge> ({risk.score.toFixed(2)})
                      </div>
                      <Progress value={Math.round(risk.score * 100)} />
                      <p className="text-sm text-gray-600">{risk.explanation}</p>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                    <h5 className="font-semibold mb-2">Memory Bias Legend</h5>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Agents remember their last 5 actions and outcomes</li>
                      <li>Repeated failed exploits reduce exploit selection probability</li>
                      <li>Successful defenses increase defense selection probability</li>
                      <li>This creates adaptive behavior based on recent performance</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Best Strategies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>Best Red Strategy: <Badge variant="destructive">{stats.bestRedStrategy}</Badge></div>
                  <div>Best Blue Strategy: <Badge variant="default">{stats.bestBlueStrategy}</Badge></div>
                  <div className="mt-4 text-sm text-gray-600">
                    These strategies showed the highest success rates across all simulation rounds.
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Strategy Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{ redCount: { label: 'Red Use Count', color: '#ef4444' }, blueCount: { label: 'Blue Use Count', color: '#2563eb' } }}>
                <BarChart data={strategyUsageData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="strategy" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="redCount" fill="#ef4444" />
                  <Bar dataKey="blueCount" fill="#2563eb" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div />
                <Button onClick={runScenarioComparisons} className="w-full">Compare All Scenarios</Button>
              </div>
              {scenarioComparisonResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="px-3 py-2">Scenario</th>
                        <th className="px-3 py-2">Red Win Rate</th>
                        <th className="px-3 py-2">Blue Win Rate</th>
                        <th className="px-3 py-2">Avg Damage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenarioComparisonResults.map(item => (
                        <tr key={item.scenarioName} className="border-t">
                          <td className="px-3 py-2">{item.scenarioName}</td>
                          <td className="px-3 py-2">{item.redWinRate.toFixed(1)}%</td>
                          <td className="px-3 py-2">{item.blueWinRate.toFixed(1)}%</td>
                          <td className="px-3 py-2">{item.avgDamage.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Run scenario comparison to benchmark current agents across all scenarios.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What-if Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="compare-scenario">Compare Scenario</Label>
                  <Select value={compareScenario.name} onValueChange={(value) => setCompareScenario(scenarios.find(s => s.name === value) || scenarios[1])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map(scenario => (
                        <SelectItem key={scenario.name} value={scenario.name}>
                          {scenario.name} ({scenario.difficulty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 md:col-span-2 flex items-end">
                  <Button onClick={runWhatIfAnalysis} className="w-full">Run What-if Comparison</Button>
                </div>
              </div>
              {whatIfSummary.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="px-3 py-2">Scenario</th>
                        <th className="px-3 py-2">Red Win Rate</th>
                        <th className="px-3 py-2">Blue Win Rate</th>
                        <th className="px-3 py-2">Draw Rate</th>
                        <th className="px-3 py-2">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whatIfSummary.map(item => (
                        <tr key={item.scenario} className="border-t">
                          <td className="px-3 py-2">{item.scenario}</td>
                          <td className="px-3 py-2">{item.redWinRate.toFixed(1)}%</td>
                          <td className="px-3 py-2">{item.blueWinRate.toFixed(1)}%</td>
                          <td className="px-3 py-2">{item.drawRate.toFixed(1)}%</td>
                          <td className="px-3 py-2">
                            <Badge variant={item.riskLabel === 'HIGH' ? 'destructive' : item.riskLabel === 'MEDIUM' ? 'secondary' : 'default'}>{item.riskLabel}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Run the comparison to benchmark the same agents across different scenarios.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analysis & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Scenario Impact</h4>
                  <p className="text-sm">
                    The {selectedScenario.name} scenario with {selectedScenario.difficulty} difficulty level
                    {selectedScenario.difficulty === 'hard' ? ' significantly reduced' : ' moderately affected'} 
                    attack success rates due to {selectedScenario.environment.userAwareness > 0.7 ? 'high user awareness' : 'environmental factors'}.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">ML Learning Progress</h4>
                  <p className="text-sm">
                    {useML ? 'Machine learning was enabled, allowing agents to adapt their strategies based on rewards and experiences.' : 'Machine learning was disabled - agents used fixed strategies.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Security Recommendations</h4>
                  {securityRecommendations ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span>Risk Level:</span>
                        <Badge variant={securityRecommendations.riskLevel === 'HIGH' ? 'destructive' : securityRecommendations.riskLevel === 'MEDIUM' ? 'secondary' : 'default'}>
                          {securityRecommendations.riskLevel}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Breach Probability: {(securityRecommendations.breachProbability * 100).toFixed(1)}%
                        </span>
                      </div>

                      <div>
                        <span className="font-medium">Top Threats:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {securityRecommendations.topThreats.map((threat, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {threat}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-medium">Recommended Defenses:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {securityRecommendations.recommendedDefenses.map((defense, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {defense}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mt-2">
                        {securityRecommendations.summary}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm">
                      Based on the simulation results, implementing {stats?.bestBlueStrategy} defense strategies
                      and monitoring for {stats?.bestRedStrategy} attack patterns would significantly improve security posture.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <RiskCard
              title="Risk Overview"
              riskLevel={risk?.label ?? 'LOW'}
              score={risk?.score ?? 0}
              description={risk?.explanation ?? 'Run a simulation to analyze risk.'}
            />
            <StatCard
              title="Red vs Blue"
              value={stats ? `${stats.redWinRate}% / ${stats.blueWinRate}%` : '—'}
              label="Red win rate vs Blue win rate"
              badge="Win Rate"
            />
            <StatCard
              title="Breach Probability"
              value={securityRecommendations ? `${(securityRecommendations.breachProbability * 100).toFixed(1)}%` : '—'}
              label="Probability of a successful breach"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <InsightCard
              title="Top Threat"
              insights={securityRecommendations?.topThreats.length ? [securityRecommendations.topThreats[0]] : ['Run a simulation to identify threats']}
              description="The most likely attack vector identified by the latest analysis."
            />
            <InsightCard
              title="Recommended Defense"
              insights={securityRecommendations?.recommendedDefenses.length ? [securityRecommendations.recommendedDefenses[0]] : ['Run a simulation to generate defenses']}
              description="The highest-impact defense for the current environment."
            />
          </div>
        </TabsContent>

        <TabsContent value="tournament" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Tournament</CardTitle>
              <CardDescription>
                Run all red agents against all blue agents to determine win rates in a round-robin tournament.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={runTournament} disabled={redAgents.length === 0 || blueAgents.length === 0}>
                  Run Tournament ({redAgents.length} Red × {blueAgents.length} Blue = {redAgents.length * blueAgents.length} matchups)
                </Button>
                <div className="text-sm text-gray-600 flex items-center">
                  Each matchup runs 100 rounds for statistical significance.
                </div>
              </div>

              {tournamentResults.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Red Agent</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Blue Agent</th>
                        <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">Red Win Rate</th>
                        <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">Blue Win Rate</th>
                        <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">Draw Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournamentResults.map((result, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-3 py-2 font-medium">{result.redAgent}</td>
                          <td className="border border-gray-300 px-3 py-2 font-medium">{result.blueAgent}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right">
                            <Badge variant={result.redWinRate > result.blueWinRate ? 'destructive' : 'secondary'}>
                              {result.redWinRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right">
                            <Badge variant={result.blueWinRate > result.redWinRate ? 'default' : 'secondary'}>
                              {result.blueWinRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right">{result.draws.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecuritySimulation;