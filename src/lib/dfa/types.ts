// Core DFA Types
export interface DFAState {
  id: string;
  label: string;
  x: number;
  y: number;
  isStart: boolean;
  isFinal: boolean;
}

export interface DFATransition {
  id: string;
  from: string;
  to: string;
  symbol: string;
}

export interface DFA {
  states: DFAState[];
  transitions: DFATransition[];
  alphabet: string[];
}

// Minimization types
export interface MinimizationStep {
  description: string;
  table: boolean[][];
  tableLabels: string[];
  markedThisStep: [number, number][];
  /** Per-step plain-English reasoning bullets */
  reasoning: string[];
}

export interface MinimizationResult {
  steps: MinimizationStep[];
  equivalenceClasses: string[][];
  minimizedDFA: DFA;
}

// String testing types
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
