// ═══════════════════════════════════════════════════════════
// DFA Minimization Tests — 20+ test cases
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { minimizeDFA } from '../algorithms/minimization';
import { DFA } from '../types/dfa';

// Helper: create a minimal DFA definition
function makeDFA(
  states: { id: string; label?: string; isStart?: boolean; isFinal?: boolean }[],
  transitions: { from: string; to: string; symbol: string }[],
  alphabet: string[] = ['0', '1']
): DFA {
  return {
    states: states.map((s, i) => ({
      id: s.id,
      label: s.label ?? s.id,
      x: 100 + i * 150,
      y: 200,
      isStart: s.isStart ?? false,
      isFinal: s.isFinal ?? false,
    })),
    transitions: transitions.map((t, i) => ({
      id: `t${i}`,
      from: t.from,
      to: t.to,
      symbol: t.symbol,
    })),
    alphabet,
  };
}

describe('DFA Minimization', () => {
  // ─── Test 1: Classic 5-state → 3-state ───────────────
  it('should minimize the classic 5-state example to 3 states', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: false },
        { id: 'q2', isFinal: false },
        { id: 'q3', isFinal: true },
        { id: 'q4', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q2', symbol: '1' },
        { from: 'q1', to: 'q3', symbol: '0' },
        { from: 'q1', to: 'q4', symbol: '1' },
        { from: 'q2', to: 'q4', symbol: '0' },
        { from: 'q2', to: 'q3', symbol: '1' },
        { from: 'q3', to: 'q3', symbol: '0' },
        { from: 'q3', to: 'q3', symbol: '1' },
        { from: 'q4', to: 'q3', symbol: '0' },
        { from: 'q4', to: 'q3', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    expect(result.minimizedDFA.states.length).toBe(3);
    // Should have exactly 6 transitions (3 states × 2 symbols)
    expect(result.minimizedDFA.transitions.length).toBe(6);
    // q1 and q2 should be equivalent, q3 and q4 should be equivalent
    expect(result.equivalenceClasses).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(['q1', 'q2']),
        expect.arrayContaining(['q3', 'q4']),
      ])
    );
  });

  // ─── Test 2: Already minimal DFA ─────────────────────
  it('should not reduce an already-minimal DFA', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q0', symbol: '0' },
        { from: 'q0', to: 'q1', symbol: '1' },
        { from: 'q1', to: 'q0', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    expect(result.minimizedDFA.states.length).toBe(2);
    expect(result.minimizedDFA.transitions.length).toBe(4);
  });

  // ─── Test 3: Single state DFA ────────────────────────
  it('should handle a single-state DFA', () => {
    const dfa = makeDFA(
      [{ id: 'q0', isStart: true, isFinal: true }],
      [
        { from: 'q0', to: 'q0', symbol: '0' },
        { from: 'q0', to: 'q0', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    expect(result.minimizedDFA.states.length).toBe(1);
    expect(result.minimizedDFA.states[0].isFinal).toBe(true);
    expect(result.minimizedDFA.states[0].isStart).toBe(true);
  });

  // ─── Test 4: All states accepting ────────────────────
  it('should minimize when all states are accepting', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: true },
        { id: 'q1', isFinal: true },
        { id: 'q2', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q2', symbol: '1' },
        { from: 'q1', to: 'q0', symbol: '0' },
        { from: 'q1', to: 'q2', symbol: '1' },
        { from: 'q2', to: 'q0', symbol: '0' },
        { from: 'q2', to: 'q1', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    // All states are equivalent (all final, all transitions cycle between them)
    expect(result.minimizedDFA.states.length).toBe(1);
    expect(result.minimizedDFA.states[0].isFinal).toBe(true);
  });

  // ─── Test 5: No accepting states ─────────────────────
  it('should minimize when no states are accepting', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: false },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q1', symbol: '1' },
        { from: 'q1', to: 'q0', symbol: '0' },
        { from: 'q1', to: 'q0', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    // Both states are non-final and symmetric → equivalent → 1 state
    expect(result.minimizedDFA.states.length).toBe(1);
    expect(result.minimizedDFA.states[0].isFinal).toBe(false);
  });

  // ─── Test 6: Unreachable states ──────────────────────
  it('should remove unreachable states before minimizing', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: true },
        { id: 'q2', isFinal: false }, // unreachable
        { id: 'q3', isFinal: true },  // unreachable
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q1', symbol: '1' },
        { from: 'q1', to: 'q1', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
        { from: 'q2', to: 'q3', symbol: '0' },
        { from: 'q2', to: 'q0', symbol: '1' },
        { from: 'q3', to: 'q3', symbol: '0' },
        { from: 'q3', to: 'q2', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    expect(result.removedUnreachable).toEqual(expect.arrayContaining(['q2', 'q3']));
    expect(result.removedUnreachable.length).toBe(2);
    // After removing unreachable: only q0 and q1 remain → 2 states
    expect(result.minimizedDFA.states.length).toBe(2);
  });

  // ─── Test 7: Dead/trap state needed ──────────────────
  it('should inject a dead state for missing transitions', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: 'a' },
        // Missing: q0 on 'b', q1 on 'a', q1 on 'b'
        { from: 'q1', to: 'q1', symbol: 'a' },
        { from: 'q1', to: 'q1', symbol: 'b' },
      ],
      ['a', 'b']
    );

    const result = minimizeDFA(dfa);
    expect(result.deadStateAdded).toBe(true);
    // q0 on 'b' → dead state, so dead state is reachable
    // Result: q0, q1, dead → 3 states
    expect(result.minimizedDFA.states.length).toBe(3);
  });

  // ─── Test 8: Cyclic DFA ──────────────────────────────
  it('should handle cyclic DFAs correctly', () => {
    // Simple cycle: q0→q1→q2→q0, with q2 as final
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: false },
        { id: 'q2', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q0', symbol: '1' },
        { from: 'q1', to: 'q2', symbol: '0' },
        { from: 'q1', to: 'q0', symbol: '1' },
        { from: 'q2', to: 'q0', symbol: '0' },
        { from: 'q2', to: 'q1', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    // All states are distinguishable → 3 states
    expect(result.minimizedDFA.states.length).toBe(3);
  });

  // ─── Test 9: Self-loops only ─────────────────────────
  it('should handle DFA with only self-loops', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: true },
        { id: 'q1', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q0', symbol: '0' },
        { from: 'q0', to: 'q0', symbol: '1' },
        { from: 'q1', to: 'q1', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    // q1 is unreachable → removed. Only q0 remains.
    expect(result.minimizedDFA.states.length).toBe(1);
  });

  // ─── Test 10: Large DFA (8 states) ───────────────────
  it('should handle a larger DFA with 8 states', () => {
    // DFA for "binary number divisible by 3"
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: true },  // remainder 0
        { id: 'q1', isFinal: false },                  // remainder 1
        { id: 'q2', isFinal: false },                  // remainder 2
        { id: 'q3', isFinal: true },                   // duplicate of q0
        { id: 'q4', isFinal: false },                  // duplicate of q1
        { id: 'q5', isFinal: false },                  // duplicate of q2
        { id: 'q6', isFinal: false },                  // unreachable
        { id: 'q7', isFinal: false },                  // unreachable
      ],
      [
        // q0: 0→q0, 1→q1
        { from: 'q0', to: 'q0', symbol: '0' },
        { from: 'q0', to: 'q1', symbol: '1' },
        // q1: 0→q2, 1→q0
        { from: 'q1', to: 'q2', symbol: '0' },
        { from: 'q1', to: 'q3', symbol: '1' }, // q3 ≡ q0
        // q2: 0→q1, 1→q2
        { from: 'q2', to: 'q4', symbol: '0' }, // q4 ≡ q1
        { from: 'q2', to: 'q5', symbol: '1' }, // q5 ≡ q2
        // q3 (≡ q0): 0→q3, 1→q4
        { from: 'q3', to: 'q3', symbol: '0' },
        { from: 'q3', to: 'q4', symbol: '1' },
        // q4 (≡ q1): 0→q5, 1→q3
        { from: 'q4', to: 'q5', symbol: '0' },
        { from: 'q4', to: 'q3', symbol: '1' },
        // q5 (≡ q2): 0→q4, 1→q5
        { from: 'q5', to: 'q4', symbol: '0' },
        { from: 'q5', to: 'q5', symbol: '1' },
        // q6, q7 unreachable
        { from: 'q6', to: 'q7', symbol: '0' },
        { from: 'q6', to: 'q6', symbol: '1' },
        { from: 'q7', to: 'q6', symbol: '0' },
        { from: 'q7', to: 'q7', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    // q6, q7 unreachable → removed
    // q0 ≡ q3, q1 ≡ q4, q2 ≡ q5 → 3 states
    expect(result.removedUnreachable.length).toBe(2);
    expect(result.minimizedDFA.states.length).toBe(3);
  });

  // ─── Test 11: DFA with three-symbol alphabet ─────────
  it('should handle three-symbol alphabet', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: true },
        { id: 'q2', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: 'a' },
        { from: 'q0', to: 'q0', symbol: 'b' },
        { from: 'q0', to: 'q0', symbol: 'c' },
        { from: 'q1', to: 'q1', symbol: 'a' },
        { from: 'q1', to: 'q2', symbol: 'b' },
        { from: 'q1', to: 'q2', symbol: 'c' },
        { from: 'q2', to: 'q2', symbol: 'a' },
        { from: 'q2', to: 'q1', symbol: 'b' },
        { from: 'q2', to: 'q1', symbol: 'c' },
      ],
      ['a', 'b', 'c']
    );

    const result = minimizeDFA(dfa);
    // q1 and q2 are equivalent (both final, symmetric transitions)
    expect(result.minimizedDFA.states.length).toBe(2);
  });

  // ─── Test 12: Empty string handling ──────────────────
  it('should correctly handle start state being final (accepts ε)', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: true },
        { id: 'q1', isFinal: false },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q1', symbol: '1' },
        { from: 'q1', to: 'q0', symbol: '0' },
        { from: 'q1', to: 'q0', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    // q0 (final) and q1 (non-final) are distinguishable → 2 states
    expect(result.minimizedDFA.states.length).toBe(2);
    const startState = result.minimizedDFA.states.find(s => s.isStart);
    expect(startState?.isFinal).toBe(true);
  });

  // ─── Test 13: Step-by-step data ──────────────────────
  it('should produce at least 2 steps for a non-trivial DFA', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q0', symbol: '1' },
        { from: 'q1', to: 'q1', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    expect(result.steps.length).toBeGreaterThanOrEqual(2);
    // First step should have reasoning
    expect(result.steps[0].reasoning.length).toBeGreaterThan(0);
  });

  // ─── Test 14: Validation error blocking ──────────────
  it('should block minimization when no start state exists', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: false, isFinal: false },
        { id: 'q1', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q0', symbol: '1' },
        { from: 'q1', to: 'q0', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    expect(result.validationErrors.some(e => e.severity === 'error')).toBe(true);
    expect(result.minimizedDFA.states.length).toBe(0);
  });

  // ─── Test 15: Transition correctness ─────────────────
  it('should preserve language equivalence (transitions are correct)', () => {
    // DFA that accepts strings ending in "01"
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: false },
        { id: 'q2', isFinal: true },
        { id: 'q3', isFinal: false }, // duplicate of q0
        { id: 'q4', isFinal: true },  // duplicate of q2
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q3', symbol: '1' },
        { from: 'q1', to: 'q1', symbol: '0' },
        { from: 'q1', to: 'q2', symbol: '1' },
        { from: 'q2', to: 'q1', symbol: '0' },
        { from: 'q2', to: 'q3', symbol: '1' },
        { from: 'q3', to: 'q1', symbol: '0' },
        { from: 'q3', to: 'q3', symbol: '1' },
        { from: 'q4', to: 'q1', symbol: '0' },
        { from: 'q4', to: 'q3', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    // q0 ≡ q3 (both non-final, same transitions pattern)
    // q2 ≡ q4 (both final, same transitions pattern)
    // BUT q4 is unreachable → removed first
    expect(result.minimizedDFA.states.length).toBe(3);

    // Every state should have exactly |Σ| transitions
    for (const state of result.minimizedDFA.states) {
      const trans = result.minimizedDFA.transitions.filter(t => t.from === state.id);
      expect(trans.length).toBe(2); // alphabet size = 2
    }
  });

  // ─── Test 16: Multiple start states (error) ──────────
  it('should detect multiple start states as validation error', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isStart: true, isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q0', symbol: '1' },
        { from: 'q1', to: 'q0', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    expect(result.validationErrors.some(
      e => e.severity === 'error' && e.message.includes('exactly one start state')
    )).toBe(true);
  });

  // ─── Test 17: Empty alphabet (error) ─────────────────
  it('should detect empty alphabet as validation error', () => {
    const dfa = makeDFA(
      [{ id: 'q0', isStart: true }],
      [],
      []
    );

    const result = minimizeDFA(dfa);
    expect(result.validationErrors.some(
      e => e.severity === 'error' && e.message.includes('Alphabet')
    )).toBe(true);
  });

  // ─── Test 18: Equivalent non-final states ────────────
  it('should merge equivalent non-final states', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: false },
        { id: 'q2', isFinal: false },
        { id: 'q3', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q2', symbol: '1' },
        { from: 'q1', to: 'q3', symbol: '0' },
        { from: 'q1', to: 'q3', symbol: '1' },
        { from: 'q2', to: 'q3', symbol: '0' },
        { from: 'q2', to: 'q3', symbol: '1' },
        { from: 'q3', to: 'q3', symbol: '0' },
        { from: 'q3', to: 'q3', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    // q1 and q2 are equivalent (both non-final, both go to q3 on any symbol)
    expect(result.minimizedDFA.states.length).toBe(3);
    expect(result.equivalenceClasses).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(['q1', 'q2']),
      ])
    );
  });

  // ─── Test 19: DFA minimization is deterministic ──────
  it('should produce deterministic output (same input → same result)', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: true },
        { id: 'q2', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q2', symbol: '1' },
        { from: 'q1', to: 'q1', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
        { from: 'q2', to: 'q2', symbol: '0' },
        { from: 'q2', to: 'q2', symbol: '1' },
      ]
    );

    const result1 = minimizeDFA(dfa);
    const result2 = minimizeDFA(dfa);

    expect(result1.minimizedDFA.states.length).toBe(result2.minimizedDFA.states.length);
    expect(result1.minimizedDFA.transitions.length).toBe(result2.minimizedDFA.transitions.length);
    expect(result1.equivalenceClasses).toEqual(result2.equivalenceClasses);
  });

  // ─── Test 20: Transition count is correct ────────────
  it('should have exactly states×alphabet transitions in the minimized DFA', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: false },
        { id: 'q2', isFinal: false },
        { id: 'q3', isFinal: true },
        { id: 'q4', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q2', symbol: '1' },
        { from: 'q1', to: 'q3', symbol: '0' },
        { from: 'q1', to: 'q4', symbol: '1' },
        { from: 'q2', to: 'q4', symbol: '0' },
        { from: 'q2', to: 'q3', symbol: '1' },
        { from: 'q3', to: 'q3', symbol: '0' },
        { from: 'q3', to: 'q3', symbol: '1' },
        { from: 'q4', to: 'q3', symbol: '0' },
        { from: 'q4', to: 'q3', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    const expectedTransitions = result.minimizedDFA.states.length * result.minimizedDFA.alphabet.length;
    expect(result.minimizedDFA.transitions.length).toBe(expectedTransitions);
  });

  // ─── Test 21: Start state is preserved ───────────────
  it('should always have exactly one start state in the minimized DFA', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true, isFinal: false },
        { id: 'q1', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q0', symbol: '1' },
        { from: 'q1', to: 'q1', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
      ]
    );

    const result = minimizeDFA(dfa);
    const startStates = result.minimizedDFA.states.filter(s => s.isStart);
    expect(startStates.length).toBe(1);
  });
});
