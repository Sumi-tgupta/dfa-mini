import { DFA, MinimizationResult, MinimizationStep, TestResult, TestStep } from './types';

// ──────────────────────────────────────────────────
// AUTO LAYOUT — place states in a circle
// ──────────────────────────────────────────────────
function autoLayout(
  stateIds: string[],
  canvasW = 720,
  canvasH = 420
): Map<string, { x: number; y: number }> {
  const n = stateIds.length;
  const positions = new Map<string, { x: number; y: number }>();
  if (n === 0) return positions;

  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const radius = Math.min(cx, cy) * 0.65;

  stateIds.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions.set(id, {
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle)),
    });
  });
  return positions;
}

// ──────────────────────────────────────────────────
// DFA VALIDATION
// ──────────────────────────────────────────────────
export function validateDFA(dfa: DFA): string[] {
  const errors: string[] = [];
  if (dfa.states.length === 0) errors.push('DFA must have at least one state.');

  const startStates = dfa.states.filter(s => s.isStart);
  if (startStates.length === 0 && dfa.states.length > 0) errors.push('DFA must have exactly one start state.');
  else if (startStates.length > 1) errors.push('DFA must have exactly one start state.');
  if (dfa.alphabet.length === 0) errors.push('Alphabet must not be empty.');

  const transitionKeys = new Set<string>();
  for (const t of dfa.transitions) {
    const key = `${t.from}-${t.symbol}`;
    if (transitionKeys.has(key)) errors.push(`Duplicate transition from "${t.from}" on "${t.symbol}".`);
    transitionKeys.add(key);
  }

  const stateIds = new Set(dfa.states.map(s => s.id));
  for (const state of dfa.states) {
    for (const symbol of dfa.alphabet) {
      if (!transitionKeys.has(`${state.id}-${symbol}`)) {
        errors.push(`State "${state.label}" missing transition on "${symbol}".`);
      }
    }
  }
  for (const t of dfa.transitions) {
    if (!stateIds.has(t.from)) errors.push(`Transition references non-existent source: "${t.from}".`);
    if (!stateIds.has(t.to)) errors.push(`Transition references non-existent target: "${t.to}".`);
  }
  return errors;
}

// ──────────────────────────────────────────────────
// STRING TESTING
// ──────────────────────────────────────────────────
export function testString(dfa: DFA, input: string): TestResult {
  const startState = dfa.states.find(s => s.isStart);
  if (!startState) return { steps: [], accepted: false };

  const steps: TestStep[] = [];
  let currentStateId = startState.id;

  for (let i = 0; i <= input.length; i++) {
    const isCurrent = i === input.length;
    const currentState = dfa.states.find(s => s.id === currentStateId);
    steps.push({
      state: currentStateId,
      remaining: input.slice(i),
      consumed: input.slice(0, i),
      isCurrent,
      isAccepted: isCurrent && currentState?.isFinal === true,
    });
    if (i < input.length) {
      const transition = dfa.transitions.find(t => t.from === currentStateId && t.symbol === input[i]);
      if (transition) currentStateId = transition.to;
      else return { steps, accepted: false };
    }
  }

  const finalState = dfa.states.find(s => s.id === currentStateId);
  return { steps, accepted: finalState?.isFinal === true };
}

// ──────────────────────────────────────────────────
// REACHABILITY ANALYSIS
// ──────────────────────────────────────────────────
function getReachableStates(dfa: DFA): Set<string> {
  const start = dfa.states.find(s => s.isStart);
  if (!start) return new Set();
  const reachable = new Set<string>();
  const queue = [start.id];
  reachable.add(start.id);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const t of dfa.transitions) {
      if (t.from === cur && !reachable.has(t.to)) {
        reachable.add(t.to);
        queue.push(t.to);
      }
    }
  }
  return reachable;
}

// ──────────────────────────────────────────────────
// DFA MINIMIZATION (Myhill–Nerode / Table-Filling)
// ──────────────────────────────────────────────────
export function minimizeDFA(dfa: DFA): MinimizationResult | null {
  // 0. Prune unreachable states
  const reachable = getReachableStates(dfa);
  const unreachableIds = dfa.states.filter(s => !reachable.has(s.id)).map(s => s.id);
  const reachableStates = dfa.states.filter(s => reachable.has(s.id));
  const reachableTransitions = dfa.transitions.filter(t => reachable.has(t.from) && reachable.has(t.to));

  const workingDFA: DFA = { ...dfa, states: reachableStates, transitions: reachableTransitions };
  const { states, transitions, alphabet } = workingDFA;

  const steps: MinimizationStep[] = [];

  if (states.length < 2) {
    return {
      steps: [{
        description: states.length === 0
          ? 'No reachable states to minimize.'
          : 'Only one reachable state. Already minimal.',
        table: [], tableLabels: [], markedThisStep: [],
        reasoning: [],
      }],
      equivalenceClasses: states.map(s => [s.id]),
      minimizedDFA: { ...workingDFA },
    };
  }

  const n = states.length;
  const labels = states.map(s => s.id);
  const stateLabel = (id: string) => states.find(s => s.id === id)?.label ?? id;

  // n×n upper-triangular distinguishability table
  const table: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  // ── Step 0: Mark final vs non-final ──────────────
  const finalSet = new Set(states.filter(s => s.isFinal).map(s => s.id));
  const nonFinalSet = new Set(states.filter(s => !s.isFinal).map(s => s.id));
  const initialMarked: [number, number][] = [];
  const step0Reasoning: string[] = [];

  if (unreachableIds.length > 0) {
    step0Reasoning.push(`Removed ${unreachableIds.length} unreachable state(s): {${unreachableIds.map(stateLabel).join(', ')}}.`);
  }

  const finals = [...finalSet].map(stateLabel);
  const nonFinals = [...nonFinalSet].map(stateLabel);
  step0Reasoning.push(`Final states: {${finals.length ? finals.join(', ') : '∅'}}`);
  step0Reasoning.push(`Non-final states: {${nonFinals.length ? nonFinals.join(', ') : '∅'}}`);
  step0Reasoning.push(`Any pair (final, non-final) is immediately distinguishable — one accepts ε, the other doesn't.`);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (finalSet.has(labels[i]) !== finalSet.has(labels[j])) {
        table[i][j] = true;
        initialMarked.push([i, j]);
        step0Reasoning.push(`Mark (${stateLabel(labels[i])}, ${stateLabel(labels[j])}): one is final, one is not.`);
      }
    }
  }

  steps.push({
    description: `Base case: Mark pairs where one state is final and the other is not. Found ${initialMarked.length} distinguishable pair(s).`,
    table: table.map(r => [...r]),
    tableLabels: [...labels],
    markedThisStep: initialMarked,
    reasoning: step0Reasoning,
  });

  // ── Step N: Iterative marking via transitions ────
  let changed = true;
  let iteration = 1;

  while (changed) {
    changed = false;
    const markedThisIteration: [number, number][] = [];
    const iterReasoning: string[] = [
      `For each unmarked pair (p, q), check every symbol σ. If δ(p,σ) and δ(q,σ) lead to an already-marked pair, mark (p, q) too.`,
    ];

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (table[i][j]) continue;

        for (const symbol of alphabet) {
          const iTarget = transitions.find(t => t.from === labels[i] && t.symbol === symbol);
          const jTarget = transitions.find(t => t.from === labels[j] && t.symbol === symbol);
          if (!iTarget || !jTarget) continue;

          let ti = labels.indexOf(iTarget.to);
          let tj = labels.indexOf(jTarget.to);
          if (ti === tj) continue; // same target — not distinguishable via this symbol

          if (ti > tj) [ti, tj] = [tj, ti];

          if (table[ti][tj]) {
            table[i][j] = true;
            changed = true;
            markedThisIteration.push([i, j]);
            iterReasoning.push(
              `Mark (${stateLabel(labels[i])}, ${stateLabel(labels[j])}): on '${symbol}', they go to (${stateLabel(iTarget.to)}, ${stateLabel(jTarget.to)}) which is already marked.`
            );
            break;
          }
        }
      }
    }

    if (markedThisIteration.length > 0) {
      steps.push({
        description: `Iteration ${iteration}: Propagate — marked ${markedThisIteration.length} more pair(s) by following transitions.`,
        table: table.map(r => [...r]),
        tableLabels: [...labels],
        markedThisStep: markedThisIteration,
        reasoning: iterReasoning,
      });
    }
    iteration++;
  }

  // ── Collect unmarked (equivalent) pairs ─────────
  const equivalentPairs: string[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!table[i][j]) equivalentPairs.push(`(${stateLabel(labels[i])}, ${stateLabel(labels[j])})`);
    }
  }

  const convergenceReasoning: string[] = [
    `No more pairs can be marked — the table has converged.`,
    equivalentPairs.length > 0
      ? `Unmarked (equivalent) pairs: ${equivalentPairs.join(', ')}.`
      : `All pairs are marked — every state is distinguishable.`,
    `States in each equivalence class will be merged into a single state.`,
  ];

  // ── Union-Find → equivalence classes ─────────────
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(a: number, b: number) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!table[i][j]) union(i, j);
    }
  }

  const classMap = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!classMap.has(root)) classMap.set(root, []);
    classMap.get(root)!.push(i);
  }
  const equivalenceClasses = Array.from(classMap.values()).map(idxs => idxs.map(i => labels[i]));

  const classDescriptions = equivalenceClasses.map((ec, i) =>
    `C${i + 1} = {${ec.map(stateLabel).join(', ')}}${ec.some(id => finalSet.has(id)) ? ' [final]' : ''}${ec.some(id => states.find(s => s.id === id)?.isStart) ? ' [start]' : ''}`
  );

  steps.push({
    description: `Convergence: Found ${equivalenceClasses.length} equivalence class(es) — these become the states of the minimized DFA.`,
    table: table.map(r => [...r]),
    tableLabels: [...labels],
    markedThisStep: [],
    reasoning: [...convergenceReasoning, ...classDescriptions],
  });

  // ── Build minimized DFA ───────────────────────────
  const classToNewState = new Map<string, string>();
  const newStates: DFA['states'] = [];
  let stateCounter = 0;

  // Auto-layout: arrange new states in a circle
  const newStateIds = equivalenceClasses.map((_, i) => `m${i}`);
  const layout = autoLayout(newStateIds, 720, 420);

  for (const ec of equivalenceClasses) {
    const newId = `m${stateCounter}`;
    classToNewState.set(ec[0], newId);
    const mergedLabels = ec.map(id => states.find(s => s.id === id)?.label ?? id);
    const pos = layout.get(newId) ?? { x: 200, y: 200 };

    newStates.push({
      id: newId,
      label: mergedLabels.join(','),
      x: pos.x,
      y: pos.y,
      isStart: ec.some(id => states.find(s => s.id === id)?.isStart),
      isFinal: ec.some(id => finalSet.has(id)),
    });
    stateCounter++;
  }

  const getMinStateId = (oldId: string): string => {
    const idx = labels.indexOf(oldId);
    if (idx === -1) return oldId;
    return classToNewState.get(labels[find(idx)]) ?? oldId;
  };

  const newTransitions: DFA['transitions'] = [];
  const seenKeys = new Set<string>();
  for (const t of transitions) {
    const from = getMinStateId(t.from);
    const to = getMinStateId(t.to);
    const key = `${from}-${t.symbol}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      newTransitions.push({ id: `mt${newTransitions.length}`, from, to, symbol: t.symbol });
    }
  }

  const minimizedDFA: DFA = { states: newStates, transitions: newTransitions, alphabet: [...alphabet] };
  return { steps, equivalenceClasses, minimizedDFA };
}
