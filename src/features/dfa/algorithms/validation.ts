// ═══════════════════════════════════════════════════════════
// DFA Validation — Comprehensive input validation
// ═══════════════════════════════════════════════════════════

import { DFA, ValidationError } from '../types/dfa';

/**
 * Validate a DFA for correctness. Returns a list of validation errors.
 * An empty array means the DFA is valid.
 *
 * Checks performed:
 * 1. At least one state exists
 * 2. Exactly one start state
 * 3. Alphabet is non-empty
 * 4. No duplicate state IDs
 * 5. No duplicate state labels (warning)
 * 6. No duplicate transitions (same from + symbol)
 * 7. All transitions reference existing states
 * 8. All transition symbols are in the alphabet
 * 9. Missing transitions reported as warnings
 */
export function validateDFA(dfa: DFA): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. At least one state
  if (dfa.states.length === 0) {
    errors.push({
      message: 'DFA must have at least one state.',
      severity: 'error',
    });
    return errors; // can't check further
  }

  // 2. Exactly one start state
  const startStates = dfa.states.filter(s => s.isStart);
  if (startStates.length === 0) {
    errors.push({
      message: 'DFA must have exactly one start state. Mark a state as the start state.',
      severity: 'error',
    });
  } else if (startStates.length > 1) {
    errors.push({
      message: `DFA must have exactly one start state, but found ${startStates.length}: ${startStates.map(s => s.label).join(', ')}.`,
      severity: 'error',
      affectedIds: startStates.map(s => s.id),
    });
  }

  // 3. Non-empty alphabet
  if (dfa.alphabet.length === 0) {
    errors.push({
      message: 'Alphabet must not be empty. Add at least one symbol.',
      severity: 'error',
    });
  }

  // 4. No duplicate state IDs
  const idCounts = new Map<string, number>();
  for (const s of dfa.states) {
    idCounts.set(s.id, (idCounts.get(s.id) ?? 0) + 1);
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      errors.push({
        message: `Duplicate state ID: "${id}" appears ${count} times.`,
        severity: 'error',
        affectedIds: [id],
      });
    }
  }

  // 5. Duplicate state labels (warning)
  const labelCounts = new Map<string, string[]>();
  for (const s of dfa.states) {
    if (!labelCounts.has(s.label)) labelCounts.set(s.label, []);
    labelCounts.get(s.label)!.push(s.id);
  }
  for (const [label, ids] of labelCounts) {
    if (ids.length > 1) {
      errors.push({
        message: `Duplicate state label: "${label}" used by ${ids.length} states. This may cause confusion.`,
        severity: 'warning',
        affectedIds: ids,
      });
    }
  }

  const stateIdSet = new Set(dfa.states.map(s => s.id));
  const alphabetSet = new Set(dfa.alphabet);

  // 6. Duplicate transitions
  const transitionKeys = new Map<string, number>();
  for (const t of dfa.transitions) {
    const key = `${t.from}-${t.symbol}`;
    transitionKeys.set(key, (transitionKeys.get(key) ?? 0) + 1);
  }
  for (const [key, count] of transitionKeys) {
    if (count > 1) {
      const [from, symbol] = key.split('-');
      const stateLabel = dfa.states.find(s => s.id === from)?.label ?? from;
      errors.push({
        message: `Duplicate transition: state "${stateLabel}" has ${count} transitions on symbol "${symbol}".`,
        severity: 'error',
        affectedIds: [from],
      });
    }
  }

  // 7. Transitions reference existing states
  for (const t of dfa.transitions) {
    if (!stateIdSet.has(t.from)) {
      errors.push({
        message: `Transition references non-existent source state: "${t.from}".`,
        severity: 'error',
        affectedIds: [t.id],
      });
    }
    if (!stateIdSet.has(t.to)) {
      errors.push({
        message: `Transition references non-existent target state: "${t.to}".`,
        severity: 'error',
        affectedIds: [t.id],
      });
    }
  }

  // 8. Transition symbols must be in alphabet
  for (const t of dfa.transitions) {
    if (!alphabetSet.has(t.symbol)) {
      const fromLabel = dfa.states.find(s => s.id === t.from)?.label ?? t.from;
      errors.push({
        message: `Transition from "${fromLabel}" uses symbol "${t.symbol}" which is not in the alphabet {${dfa.alphabet.join(', ')}}.`,
        severity: 'error',
        affectedIds: [t.id],
      });
    }
  }

  // 9. Missing transitions (warnings — the algorithm can handle these via trap state)
  for (const state of dfa.states) {
    for (const symbol of dfa.alphabet) {
      const key = `${state.id}-${symbol}`;
      if (!transitionKeys.has(key)) {
        errors.push({
          message: `State "${state.label}" is missing a transition on symbol "${symbol}". A trap state will be added during minimization.`,
          severity: 'warning',
          affectedIds: [state.id],
        });
      }
    }
  }

  return errors;
}

/**
 * Returns true if the DFA has any blocking (error-level) validation issues.
 */
export function hasBlockingErrors(errors: ValidationError[]): boolean {
  return errors.some(e => e.severity === 'error');
}
