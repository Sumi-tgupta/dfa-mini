// ═══════════════════════════════════════════════════════════
// DFA Minimization — Mathematically Correct Table-Filling
// (Myhill–Nerode Theorem)
// ═══════════════════════════════════════════════════════════
//
// Algorithm overview:
//   1. Remove unreachable states (BFS from start state)
//   2. Make DFA total by injecting a dead/trap state for missing transitions
//   3. Build distinguishability table (upper-triangular n×n boolean matrix)
//   4. Base case: Mark all (final, non-final) pairs
//   5. Inductive step: For unmarked pair (p,q), if ∃ symbol σ such that
//      (δ(p,σ), δ(q,σ)) is already marked, then mark (p,q)
//   6. Repeat step 5 until no changes (fixpoint)
//   7. Merge unmarked pairs via Union-Find → equivalence classes
//   8. Build minimized DFA: one state per class, one transition per (class, symbol)
//   9. Optionally remove dead state if it's unnecessary
//
// Correctness guarantee:
//   The resulting DFA is provably minimal — it has the fewest states of any
//   DFA recognizing the same language (Myhill-Nerode theorem).
//
// ═══════════════════════════════════════════════════════════

import {
  DFA,
  DFAState,
  DFATransition,
  MinimizationResult,
  MinimizationStep,
  DEAD_STATE_ID,
  DEAD_STATE_LABEL,
} from '../types/dfa';
import {
  removeUnreachableStates,
  makeDFATotal,
  buildTransitionMap,
  UnionFind,
  autoLayout,
  getStateLabel,
} from './utils';
import { validateDFA, hasBlockingErrors } from './validation';

/**
 * Minimize a DFA using the Myhill-Nerode table-filling algorithm.
 *
 * Returns null if the DFA has blocking validation errors.
 * The result includes step-by-step explanation data for UI visualization.
 */
export function minimizeDFA(dfa: DFA): MinimizationResult {
  // ──────────────────────────────────────────────
  // Step 0: Validate
  // ──────────────────────────────────────────────
  const validationErrors = validateDFA(dfa);
  if (hasBlockingErrors(validationErrors)) {
    return {
      steps: [{
        description: 'Cannot minimize: DFA has validation errors.',
        table: [],
        tableLabels: [],
        markedThisStep: [],
        reasoning: validationErrors.filter(e => e.severity === 'error').map(e => `❌ ${e.message}`),
      }],
      equivalenceClasses: [],
      minimizedDFA: { states: [], transitions: [], alphabet: [] },
      removedUnreachable: [],
      deadStateAdded: false,
      validationErrors,
    };
  }

  const steps: MinimizationStep[] = [];

  // ──────────────────────────────────────────────
  // Step 1: Remove unreachable states
  // ──────────────────────────────────────────────
  const { dfa: reachableDFA, removed: removedUnreachable } = removeUnreachableStates(dfa);

  // ──────────────────────────────────────────────
  // Step 2: Make DFA total (inject dead state)
  // ──────────────────────────────────────────────
  const { dfa: totalDFA, deadStateAdded } = makeDFATotal(reachableDFA);

  const { states, transitions, alphabet } = totalDFA;

  // ──────────────────────────────────────────────
  // Edge case: 0 or 1 reachable states
  // ──────────────────────────────────────────────
  if (states.length <= 1) {
    const reasoning: string[] = [];
    if (removedUnreachable.length > 0) {
      reasoning.push(`Removed ${removedUnreachable.length} unreachable state(s): {${removedUnreachable.map(id => getStateLabel(dfa, id)).join(', ')}}.`);
    }
    reasoning.push(
      states.length === 0
        ? 'No reachable states remain.'
        : 'Only one reachable state. Already minimal.'
    );

    return {
      steps: [{
        description: states.length === 0
          ? 'No reachable states to minimize.'
          : 'Only one reachable state — already minimal.',
        table: [],
        tableLabels: [],
        markedThisStep: [],
        reasoning,
      }],
      equivalenceClasses: states.map(s => [s.id]),
      minimizedDFA: { ...totalDFA },
      removedUnreachable,
      deadStateAdded,
      validationErrors,
    };
  }

  // ──────────────────────────────────────────────
  // Preparation
  // ──────────────────────────────────────────────
  const n = states.length;
  const stateIds = states.map(s => s.id);
  const label = (id: string) => states.find(s => s.id === id)?.label ?? id;
  const transMap = buildTransitionMap(transitions);
  const finalSet = new Set(states.filter(s => s.isFinal).map(s => s.id));

  // n×n upper-triangular distinguishability table
  // table[i][j] = true means states i and j are distinguishable (i < j)
  const table: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  // ──────────────────────────────────────────────
  // Step 3: Base case — mark (final, non-final) pairs
  // ──────────────────────────────────────────────
  const initialMarked: [number, number][] = [];
  const step0Reasoning: string[] = [];

  if (removedUnreachable.length > 0) {
    step0Reasoning.push(
      `Removed ${removedUnreachable.length} unreachable state(s): {${removedUnreachable.map(id => getStateLabel(dfa, id)).join(', ')}}.`
    );
  }

  if (deadStateAdded) {
    step0Reasoning.push(
      `Added trap state "${DEAD_STATE_LABEL}" for missing transitions (makes the DFA total).`
    );
  }

  const finalLabels = states.filter(s => s.isFinal).map(s => s.label);
  const nonFinalLabels = states.filter(s => !s.isFinal).map(s => s.label);
  step0Reasoning.push(`Final states: {${finalLabels.length ? finalLabels.join(', ') : '∅'}}`);
  step0Reasoning.push(`Non-final states: {${nonFinalLabels.length ? nonFinalLabels.join(', ') : '∅'}}`);
  step0Reasoning.push('Any pair (final, non-final) is immediately distinguishable — one accepts ε, the other does not.');

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const iFinal = finalSet.has(stateIds[i]);
      const jFinal = finalSet.has(stateIds[j]);
      if (iFinal !== jFinal) {
        table[i][j] = true;
        initialMarked.push([i, j]);
        step0Reasoning.push(
          `Mark (${label(stateIds[i])}, ${label(stateIds[j])}): one is final, one is not.`
        );
      }
    }
  }

  steps.push({
    description: `Base case: Mark pairs where one state is final and the other is not. Found ${initialMarked.length} distinguishable pair(s).`,
    table: table.map(r => [...r]),
    tableLabels: stateIds.map(label),
    markedThisStep: initialMarked,
    reasoning: step0Reasoning,
  });

  // ──────────────────────────────────────────────
  // Step 4: Iterative marking via transition following
  // ──────────────────────────────────────────────
  let changed = true;
  let iteration = 1;

  while (changed) {
    changed = false;
    const markedThisIteration: [number, number][] = [];
    const iterReasoning: string[] = [
      `For each unmarked pair (p, q), check every symbol σ. If δ(p,σ) and δ(q,σ) lead to an already-marked pair, mark (p, q).`,
    ];

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (table[i][j]) continue; // already marked

        for (const sym of alphabet) {
          // Both transitions MUST exist since we made the DFA total
          const iTarget = transMap.get(`${stateIds[i]}-${sym}`);
          const jTarget = transMap.get(`${stateIds[j]}-${sym}`);

          // Safety check (shouldn't happen in total DFA)
          if (iTarget === undefined || jTarget === undefined) continue;

          // Same target → doesn't distinguish
          if (iTarget === jTarget) continue;

          // Look up indices and normalize to i < j
          let ti = stateIds.indexOf(iTarget);
          let tj = stateIds.indexOf(jTarget);
          if (ti > tj) [ti, tj] = [tj, ti];

          if (table[ti][tj]) {
            table[i][j] = true;
            changed = true;
            markedThisIteration.push([i, j]);
            iterReasoning.push(
              `Mark (${label(stateIds[i])}, ${label(stateIds[j])}): on '${sym}', they go to (${label(iTarget)}, ${label(jTarget)}) which is already marked.`
            );
            break; // one symbol is enough to distinguish
          }
        }
      }
    }

    if (markedThisIteration.length > 0) {
      steps.push({
        description: `Iteration ${iteration}: Propagate — marked ${markedThisIteration.length} more pair(s) by following transitions.`,
        table: table.map(r => [...r]),
        tableLabels: stateIds.map(label),
        markedThisStep: markedThisIteration,
        reasoning: iterReasoning,
      });
    }

    iteration++;
  }

  // ──────────────────────────────────────────────
  // Step 5: Collect results — merge unmarked pairs
  // ──────────────────────────────────────────────
  const equivalentPairs: string[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!table[i][j]) {
        equivalentPairs.push(`(${label(stateIds[i])}, ${label(stateIds[j])})`);
      }
    }
  }

  // Union-Find to compute equivalence classes
  const uf = new UnionFind(n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!table[i][j]) {
        uf.union(i, j);
      }
    }
  }

  const classMap = uf.getClasses();
  const equivalenceClasses: string[][] = Array.from(classMap.values())
    .map(indices => indices.map(i => stateIds[i]));

  // Convergence step reasoning
  const convergenceReasoning: string[] = [
    'No more pairs can be marked — the table has converged.',
    equivalentPairs.length > 0
      ? `Unmarked (equivalent) pairs: ${equivalentPairs.join(', ')}.`
      : 'All pairs are marked — every state is distinguishable.',
    'States in each equivalence class will be merged into a single state.',
  ];

  const classDescriptions = equivalenceClasses.map((ec, i) => {
    const labels = ec.map(label).join(', ');
    const isFinal = ec.some(id => finalSet.has(id));
    const isStart = ec.some(id => states.find(s => s.id === id)?.isStart);
    let desc = `C${i + 1} = {${labels}}`;
    if (isFinal) desc += ' [final]';
    if (isStart) desc += ' [start]';
    return desc;
  });

  steps.push({
    description: `Convergence: Found ${equivalenceClasses.length} equivalence class(es) — these become the states of the minimized DFA.`,
    table: table.map(r => [...r]),
    tableLabels: stateIds.map(label),
    markedThisStep: [],
    reasoning: [...convergenceReasoning, ...classDescriptions],
  });

  // ──────────────────────────────────────────────
  // Step 6: Build minimized DFA
  // ──────────────────────────────────────────────
  // Map each old state to its new class index
  const stateToClassIndex = new Map<string, number>();
  equivalenceClasses.forEach((ec, idx) => {
    for (const stateId of ec) {
      stateToClassIndex.set(stateId, idx);
    }
  });

  // Filter out the dead state class if it was added and is unreachable/unnecessary
  // We keep the dead state class if any original reachable state transitions to it
  let filteredClasses = equivalenceClasses;
  let deadClassIndex = -1;

  if (deadStateAdded) {
    deadClassIndex = equivalenceClasses.findIndex(ec => ec.includes(DEAD_STATE_ID));
  }

  // Build new state for each class
  const newStateIds = filteredClasses.map((_, i) => `m${i}`);
  const layout = autoLayout(newStateIds);

  const newStates: DFAState[] = filteredClasses.map((ec, i) => {
    const newId = `m${i}`;
    // Use original labels (skip dead state label if mixed)
    const originalLabels = ec
      .filter(id => id !== DEAD_STATE_ID)
      .map(id => label(id));
    const mergedLabel = originalLabels.length > 0
      ? originalLabels.join(',')
      : DEAD_STATE_LABEL;

    const pos = layout.get(newId) ?? { x: 200, y: 200 };

    return {
      id: newId,
      label: mergedLabel,
      x: pos.x,
      y: pos.y,
      isStart: ec.some(id => states.find(s => s.id === id)?.isStart === true),
      isFinal: ec.some(id => finalSet.has(id)),
    };
  });

  // Build transitions: for each class, use ONE representative's transitions
  const newTransitions: DFATransition[] = [];
  const seenTransKeys = new Set<string>();
  let tCounter = 0;

  for (let ci = 0; ci < filteredClasses.length; ci++) {
    const representative = filteredClasses[ci][0]; // pick first state as representative

    for (const sym of alphabet) {
      const target = transMap.get(`${representative}-${sym}`);
      if (target === undefined) continue;

      const targetClassIndex = stateToClassIndex.get(target);
      if (targetClassIndex === undefined) continue;

      const fromId = newStateIds[ci];
      const toId = newStateIds[targetClassIndex];
      const key = `${fromId}-${sym}`;

      if (!seenTransKeys.has(key)) {
        seenTransKeys.add(key);
        newTransitions.push({
          id: `mt${tCounter++}`,
          from: fromId,
          to: toId,
          symbol: sym,
        });
      }
    }
  }

  // Optionally: remove the dead state from the minimized DFA if desired
  // We keep it because it makes the DFA total, but we flag it
  let minimizedStates = newStates;
  let minimizedTransitions = newTransitions;

  // If dead state was added and its class only contains __dead__ and ALL its
  // transitions loop to itself, we can optionally hide it.
  // For now we include it for mathematical correctness, but mark it.
  // The UI can choose to hide dead-state nodes.

  const minimizedDFA: DFA = {
    states: minimizedStates,
    transitions: minimizedTransitions,
    alphabet: [...alphabet],
  };

  // Map equivalence classes back to original (non-dead) state IDs
  const originalEquivalenceClasses = equivalenceClasses.map(ec =>
    ec.filter(id => id !== DEAD_STATE_ID)
  ).filter(ec => ec.length > 0);

  return {
    steps,
    equivalenceClasses: originalEquivalenceClasses,
    minimizedDFA,
    removedUnreachable,
    deadStateAdded,
    validationErrors,
  };
}
