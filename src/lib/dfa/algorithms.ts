import { DFA, MinimizationResult, MinimizationStep, TestResult, TestStep } from './types';

// ──────────────────────────────────────────────────
// DFA VALIDATION
// ──────────────────────────────────────────────────
export function validateDFA(dfa: DFA): string[] {
  const errors: string[] = [];

  if (dfa.states.length === 0) {
    errors.push('DFA must have at least one state.');
  }

  const startStates = dfa.states.filter(s => s.isStart);
  if (startStates.length === 0 && dfa.states.length > 0) {
    errors.push('DFA must have exactly one start state.');
  } else if (startStates.length > 1) {
    errors.push('DFA must have exactly one start state.');
  }

  if (dfa.alphabet.length === 0) {
    errors.push('Alphabet must not be empty.');
  }

  // Check for duplicate transitions
  const transitionKeys = new Set<string>();
  for (const t of dfa.transitions) {
    const key = `${t.from}-${t.symbol}`;
    if (transitionKeys.has(key)) {
      errors.push(`Duplicate transition from state "${t.from}" on symbol "${t.symbol}".`);
    }
    transitionKeys.add(key);
  }

  // Check completeness: every state must have a transition for every alphabet symbol
  for (const state of dfa.states) {
    for (const symbol of dfa.alphabet) {
      const key = `${state.id}-${symbol}`;
      if (!transitionKeys.has(key)) {
        errors.push(`State "${state.label}" is missing a transition on symbol "${symbol}".`);
      }
    }
  }

  // Check that transition targets are valid states
  const stateIds = new Set(dfa.states.map(s => s.id));
  for (const t of dfa.transitions) {
    if (!stateIds.has(t.from)) {
      errors.push(`Transition references non-existent source state: "${t.from}".`);
    }
    if (!stateIds.has(t.to)) {
      errors.push(`Transition references non-existent target state: "${t.to}".`);
    }
  }

  return errors;
}

// ──────────────────────────────────────────────────
// DFA STRING TESTING
// ──────────────────────────────────────────────────
export function testString(dfa: DFA, input: string): TestResult {
  const startState = dfa.states.find(s => s.isStart);
  if (!startState) {
    return { steps: [], accepted: false };
  }

  const steps: TestStep[] = [];
  let currentStateId = startState.id;

  for (let i = 0; i <= input.length; i++) {
    const isCurrent = i === input.length;
    const currentState = dfa.states.find(s => s.id === currentStateId);
    const isAccepted = isCurrent && currentState?.isFinal === true;

    steps.push({
      state: currentStateId,
      remaining: input.slice(i),
      consumed: input.slice(0, i),
      isCurrent,
      isAccepted,
    });

    if (i < input.length) {
      const symbol = input[i];
      const transition = dfa.transitions.find(
        t => t.from === currentStateId && t.symbol === symbol
      );

      if (transition) {
        currentStateId = transition.to;
      } else {
        return { steps, accepted: false };
      }
    }
  }

  const finalState = dfa.states.find(s => s.id === currentStateId);
  return {
    steps,
    accepted: finalState?.isFinal === true,
  };
}

// ──────────────────────────────────────────────────
// REACHABILITY ANALYSIS
// ──────────────────────────────────────────────────
function getReachableStates(dfa: DFA): Set<string> {
  const startState = dfa.states.find(s => s.isStart);
  if (!startState) return new Set();

  const reachable = new Set<string>();
  const queue = [startState.id];
  reachable.add(startState.id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const t of dfa.transitions) {
      if (t.from === current && !reachable.has(t.to)) {
        reachable.add(t.to);
        queue.push(t.to);
      }
    }
  }

  return reachable;
}

// ──────────────────────────────────────────────────
// DFA MINIMIZATION (Table-Filling / Myhill–Nerode)
// ──────────────────────────────────────────────────
export function minimizeDFA(dfa: DFA): MinimizationResult | null {
  // Step 0: Remove unreachable states first
  const reachable = getReachableStates(dfa);
  const reachableStates = dfa.states.filter(s => reachable.has(s.id));
  const reachableTransitions = dfa.transitions.filter(
    t => reachable.has(t.from) && reachable.has(t.to)
  );
  const unreachableCount = dfa.states.length - reachableStates.length;

  const workingDFA: DFA = {
    ...dfa,
    states: reachableStates,
    transitions: reachableTransitions,
  };

  const { states, transitions } = workingDFA;

  if (states.length < 2) {
    return {
      steps: [{
        description: states.length === 0
          ? 'No reachable states to minimize.'
          : `DFA has only one reachable state${unreachableCount > 0 ? ` (removed ${unreachableCount} unreachable state(s))` : ''}. Already minimal.`,
        table: [],
        tableLabels: [],
        markedThisStep: [],
      }],
      equivalenceClasses: states.map(s => [s.id]),
      minimizedDFA: { ...workingDFA },
    };
  }

  const n = states.length;
  const labels = states.map(s => s.id);

  // Create an n × n upper-triangular table (table[i][j] = true means distinguishable, i < j)
  const table: boolean[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => false)
  );

  const steps: MinimizationStep[] = [];

  // Step 1: Mark pairs where one is final and the other is not
  const finalSet = new Set(states.filter(s => s.isFinal).map(s => s.id));
  const initialMarked: [number, number][] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const iFinal = finalSet.has(labels[i]);
      const jFinal = finalSet.has(labels[j]);
      if (iFinal !== jFinal) {
        table[i][j] = true;
        initialMarked.push([i, j]);
      }
    }
  }

  const unreachableNote = unreachableCount > 0
    ? ` (${unreachableCount} unreachable state(s) were removed before minimization)`
    : '';

  steps.push({
    description: initialMarked.length > 0
      ? `Marked ${initialMarked.length} pair(s) where one state is final and the other is not.${unreachableNote}`
      : `No initial distinguishable pairs found.${unreachableNote}`,
    table: table.map(r => [...r]),
    tableLabels: [...labels],
    markedThisStep: initialMarked,
  });

  // Step 2: Iteratively mark distinguishable pairs via transitions
  let changed = true;
  let iteration = 1;

  while (changed) {
    changed = false;
    const markedThisIteration: [number, number][] = [];

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (table[i][j]) continue;

        for (const symbol of workingDFA.alphabet) {
          const iTarget = transitions.find(t => t.from === labels[i] && t.symbol === symbol);
          const jTarget = transitions.find(t => t.from === labels[j] && t.symbol === symbol);

          if (!iTarget || !jTarget) continue;

          let ti = labels.indexOf(iTarget.to);
          let tj = labels.indexOf(jTarget.to);

          // Normalize to upper-triangular index (ti < tj)
          if (ti === tj) continue; // same target → not distinguishable via this symbol
          if (ti > tj) [ti, tj] = [tj, ti];

          if (table[ti][tj]) {
            table[i][j] = true;
            changed = true;
            markedThisIteration.push([i, j]);
            break;
          }
        }
      }
    }

    if (markedThisIteration.length > 0) {
      steps.push({
        description: `Iteration ${iteration}: Marked ${markedThisIteration.length} additional distinguishable pair(s) via transitions.`,
        table: table.map(r => [...r]),
        tableLabels: [...labels],
        markedThisStep: markedThisIteration,
      });
      iteration++;
    }
  }

  // Step 3: Union-Find to extract equivalence classes from unmarked pairs
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(a: number, b: number) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!table[i][j]) {
        union(i, j);
      }
    }
  }

  const classMap = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!classMap.has(root)) classMap.set(root, []);
    classMap.get(root)!.push(i);
  }

  const equivalenceClasses = Array.from(classMap.values()).map(indices =>
    indices.map(i => labels[i])
  );

  steps.push({
    description: `Found ${equivalenceClasses.length} equivalence class(es): ${equivalenceClasses.map(ec => `{${ec.join(', ')}}`).join(', ')}.`,
    table: table.map(r => [...r]),
    tableLabels: [...labels],
    markedThisStep: [],
  });

  // Step 4: Build minimized DFA
  // Map: representative label → new state ID
  const classToNewState = new Map<string, string>();
  const newStates: DFA['states'] = [];
  let stateCounter = 0;

  for (const ec of equivalenceClasses) {
    const representative = states.find(s => s.id === ec[0])!;
    const newId = `q${stateCounter}`;
    classToNewState.set(ec[0], newId);

    const mergedLabel = ec.map(id => states.find(s => s.id === id)?.label || id).join(',');

    newStates.push({
      id: newId,
      label: mergedLabel,
      x: representative.x,
      y: representative.y,
      isStart: ec.some(id => states.find(s => s.id === id)?.isStart),
      isFinal: ec.some(id => states.find(s => s.id === id)?.isFinal),
    });
    stateCounter++;
  }

  const getNewStateId = (oldId: string): string => {
    const idx = labels.indexOf(oldId);
    if (idx === -1) return oldId;
    const root = find(idx);
    // classMap keys are union-find roots; classToNewState maps ec[0] = labels[root]
    return classToNewState.get(labels[root]) || oldId;
  };

  const newTransitions: DFA['transitions'] = [];
  const seenTransitions = new Set<string>();

  for (const t of transitions) {
    const newFrom = getNewStateId(t.from);
    const newTo = getNewStateId(t.to);
    const key = `${newFrom}-${t.symbol}`;

    if (!seenTransitions.has(key)) {
      seenTransitions.add(key);
      newTransitions.push({
        id: `t-${newTransitions.length}`,
        from: newFrom,
        to: newTo,
        symbol: t.symbol,
      });
    }
  }

  const minimizedDFA: DFA = {
    states: newStates,
    transitions: newTransitions,
    alphabet: [...workingDFA.alphabet],
  };

  return { steps, equivalenceClasses, minimizedDFA };
}
