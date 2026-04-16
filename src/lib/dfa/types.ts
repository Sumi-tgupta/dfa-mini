// Legacy compatibility re-exports
// New code should import from '@/features/dfa/types/dfa'

export type { DFAState, DFATransition, DFA } from '@/features/dfa/types/dfa';
export type { MinimizationStep, MinimizationResult } from '@/features/dfa/types/dfa';

// Legacy TestResult type — maps to new SimulationResult shape
export interface TestStep {
  state: string;
  remaining: string;
  consumed: string;
  isCurrent: boolean;
  isAccepted: boolean;
}

export interface TestResult {
  steps: TestStep[];
  accepted: boolean;
}
