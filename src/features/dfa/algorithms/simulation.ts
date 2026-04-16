// ═══════════════════════════════════════════════════════════
// String Simulation — Test strings against a DFA
// ═══════════════════════════════════════════════════════════

import { DFA, SimulationResult, SimulationStep, DEAD_STATE_ID } from '../types/dfa';
import { buildTransitionMap } from './utils';

/**
 * Simulate a string on a DFA, producing step-by-step trace.
 *
 * Handles:
 * - Complete DFAs (all transitions present)
 * - Incomplete DFAs (missing transitions → implicitly rejected)
 * - Empty strings (ε)
 * - The dead state indicator
 *
 * Always produces a complete step array, even when a transition is missing.
 */
export function simulateString(dfa: DFA, input: string): SimulationResult {
  const startState = dfa.states.find(s => s.isStart);

  if (!startState) {
    return {
      steps: [],
      accepted: false,
      rejectionReason: 'No start state defined.',
    };
  }

  if (dfa.states.length === 0) {
    return {
      steps: [],
      accepted: false,
      rejectionReason: 'DFA has no states.',
    };
  }

  const transMap = buildTransitionMap(dfa.transitions);
  const steps: SimulationStep[] = [];
  let currentStateId = startState.id;
  let stuck = false;

  for (let i = 0; i <= input.length; i++) {
    const atEnd = i === input.length;
    const currentState = dfa.states.find(s => s.id === currentStateId);
    const isFinalState = currentState?.isFinal === true;
    const isDeadState = currentStateId === DEAD_STATE_ID;

    steps.push({
      stateId: currentStateId,
      symbol: atEnd ? undefined : input[i],
      consumed: input.slice(0, i),
      remaining: input.slice(i),
      isFinal: atEnd || stuck,
      isAccepted: atEnd && isFinalState && !stuck,
      isDeadState,
    });

    if (atEnd || stuck) break;

    // Follow transition
    const symbol = input[i];
    const target = transMap.get(`${currentStateId}-${symbol}`);

    if (target !== undefined) {
      currentStateId = target;
    } else {
      // Missing transition — the string is stuck (implicitly rejected)
      // Add one more step showing we're stuck
      stuck = true;
      steps.push({
        stateId: currentStateId,
        symbol: undefined,
        consumed: input.slice(0, i + 1),
        remaining: input.slice(i + 1),
        isFinal: true,
        isAccepted: false,
        isDeadState: false,
      });
      break;
    }
  }

  const lastStep = steps[steps.length - 1];
  const accepted = lastStep?.isAccepted ?? false;

  return {
    steps,
    accepted,
    rejectionReason: !accepted
      ? stuck
        ? `No transition defined from current state on symbol "${input[steps.length - 2] ?? '?'}".`
        : `String consumed but ended in non-accepting state "${dfa.states.find(s => s.id === currentStateId)?.label ?? currentStateId}".`
      : undefined,
  };
}

// ─── Legacy compat wrapper ──────────────────────────────

/** Legacy-compatible wrapper that maps new SimulationResult to old TestResult shape */
export function testString(
  dfa: DFA,
  input: string
): { steps: { state: string; remaining: string; consumed: string; isCurrent: boolean; isAccepted: boolean }[]; accepted: boolean } {
  const result = simulateString(dfa, input);

  const mappedSteps = result.steps.map((step, i) => ({
    state: step.stateId,
    remaining: step.remaining,
    consumed: step.consumed,
    isCurrent: i === result.steps.length - 1,
    isAccepted: step.isAccepted,
  }));

  return {
    steps: mappedSteps,
    accepted: result.accepted,
  };
}
