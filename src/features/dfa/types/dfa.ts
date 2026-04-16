// ═══════════════════════════════════════════════════════════
// DFA Core Types — Strict, well-documented type definitions
// ═══════════════════════════════════════════════════════════

/** Sentinel ID for the implicit trap/dead state added during minimization */
export const DEAD_STATE_ID = '__dead__';
export const DEAD_STATE_LABEL = '∅';

// ─── Core DFA Model ─────────────────────────────────────

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

// ─── Validation ─────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationError {
  message: string;
  severity: ValidationSeverity;
  /** Which state/transition is affected (for UI highlighting) */
  affectedIds?: string[];
}

// ─── Minimization ───────────────────────────────────────

export interface MinimizationStep {
  description: string;
  /** Upper-triangular distinguishability table (n×n) */
  table: boolean[][];
  /** State IDs used as row/column labels */
  tableLabels: string[];
  /** Pairs [i,j] marked during this step */
  markedThisStep: [number, number][];
  /** Human-readable reasoning bullets */
  reasoning: string[];
}

export interface MinimizationResult {
  steps: MinimizationStep[];
  equivalenceClasses: string[][];
  minimizedDFA: DFA;
  /** IDs of states removed as unreachable */
  removedUnreachable: string[];
  /** Whether a dead/trap state was injected */
  deadStateAdded: boolean;
  /** Validation errors found (if any, minimization was blocked) */
  validationErrors: ValidationError[];
}

// ─── String Simulation ──────────────────────────────────

export interface SimulationStep {
  /** Current state ID */
  stateId: string;
  /** The symbol about to be consumed (undefined at final step) */
  symbol?: string;
  /** Input consumed so far */
  consumed: string;
  /** Input remaining */
  remaining: string;
  /** Is this the final step? */
  isFinal: boolean;
  /** Is the string accepted at this point? (only meaningful at final step) */
  isAccepted: boolean;
  /** Did the transition go to the dead state? */
  isDeadState: boolean;
}

export interface SimulationResult {
  steps: SimulationStep[];
  accepted: boolean;
  /** Reason for rejection if rejected */
  rejectionReason?: string;
}

// ─── Example DFA ────────────────────────────────────────

export interface ExampleDFA {
  id: string;
  name: string;
  description: string;
  /** Language description (e.g. "L = {w | w ends with 01}") */
  language?: string;
  dfa: DFA;
  /** Expected minimized state count */
  expectedMinStates?: number;
}
