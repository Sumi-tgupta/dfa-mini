// ═══════════════════════════════════════════════════════════
// DFA Validation Tests
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { validateDFA, hasBlockingErrors } from '../algorithms/validation';
import { DFA } from '../types/dfa';

function makeDFA(
  states: { id: string; isStart?: boolean; isFinal?: boolean }[],
  transitions: { from: string; to: string; symbol: string }[],
  alphabet: string[] = ['0', '1']
): DFA {
  return {
    states: states.map((s, i) => ({
      id: s.id,
      label: s.id,
      x: 100 + i * 100,
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

describe('DFA Validation', () => {
  it('should pass a valid complete DFA', () => {
    const dfa = makeDFA(
      [{ id: 'q0', isStart: true }, { id: 'q1', isFinal: true }],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        { from: 'q0', to: 'q0', symbol: '1' },
        { from: 'q1', to: 'q1', symbol: '0' },
        { from: 'q1', to: 'q1', symbol: '1' },
      ]
    );
    const errors = validateDFA(dfa);
    expect(hasBlockingErrors(errors)).toBe(false);
  });

  it('should detect no states', () => {
    const dfa = makeDFA([], [], []);
    const errors = validateDFA(dfa);
    expect(errors.some(e => e.severity === 'error' && e.message.includes('at least one state'))).toBe(true);
  });

  it('should detect missing start state', () => {
    const dfa = makeDFA([{ id: 'q0' }], [], ['0']);
    const errors = validateDFA(dfa);
    expect(errors.some(e => e.severity === 'error' && e.message.includes('start state'))).toBe(true);
  });

  it('should detect multiple start states', () => {
    const dfa = makeDFA(
      [{ id: 'q0', isStart: true }, { id: 'q1', isStart: true }],
      [], ['0']
    );
    const errors = validateDFA(dfa);
    expect(errors.some(e => e.severity === 'error' && e.message.includes('exactly one'))).toBe(true);
  });

  it('should detect empty alphabet', () => {
    const dfa = makeDFA([{ id: 'q0', isStart: true }], [], []);
    const errors = validateDFA(dfa);
    expect(errors.some(e => e.severity === 'error' && e.message.includes('Alphabet'))).toBe(true);
  });

  it('should detect transition to non-existent state', () => {
    const dfa = makeDFA(
      [{ id: 'q0', isStart: true }],
      [{ from: 'q0', to: 'q999', symbol: '0' }]
    );
    const errors = validateDFA(dfa);
    expect(errors.some(e => e.severity === 'error' && e.message.includes('non-existent'))).toBe(true);
  });

  it('should detect invalid transition symbol', () => {
    const dfa = makeDFA(
      [{ id: 'q0', isStart: true }],
      [{ from: 'q0', to: 'q0', symbol: 'x' }]
    );
    const errors = validateDFA(dfa);
    expect(errors.some(e => e.severity === 'error' && e.message.includes('not in the alphabet'))).toBe(true);
  });

  it('should warn about missing transitions', () => {
    const dfa = makeDFA(
      [{ id: 'q0', isStart: true }],
      [{ from: 'q0', to: 'q0', symbol: '0' }]
    );
    const errors = validateDFA(dfa);
    const warnings = errors.filter(e => e.severity === 'warning');
    expect(warnings.some(e => e.message.includes('missing a transition'))).toBe(true);
  });

  it('should detect duplicate transitions (nondeterminism)', () => {
    const dfa: DFA = {
      states: [
        { id: 'q0', label: 'q0', x: 100, y: 200, isStart: true, isFinal: false },
        { id: 'q1', label: 'q1', x: 200, y: 200, isStart: false, isFinal: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q0', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q1', symbol: '0' }, // duplicate from+symbol
        { id: 't2', from: 'q0', to: 'q1', symbol: '1' },
        { id: 't3', from: 'q1', to: 'q1', symbol: '0' },
        { id: 't4', from: 'q1', to: 'q1', symbol: '1' },
      ],
      alphabet: ['0', '1'],
    };
    const errors = validateDFA(dfa);
    expect(errors.some(e => e.severity === 'error' && e.message.includes('Duplicate transition'))).toBe(true);
  });

  it('should warn about duplicate labels', () => {
    const dfa: DFA = {
      states: [
        { id: 'q0', label: 'same', x: 100, y: 200, isStart: true, isFinal: false },
        { id: 'q1', label: 'same', x: 200, y: 200, isStart: false, isFinal: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
        { id: 't2', from: 'q1', to: 'q1', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q1', symbol: '1' },
      ],
      alphabet: ['0', '1'],
    };
    const errors = validateDFA(dfa);
    expect(errors.some(e => e.severity === 'warning' && e.message.includes('Duplicate state label'))).toBe(true);
  });

  it('hasBlockingErrors should return false for warning-only results', () => {
    const dfa = makeDFA(
      [{ id: 'q0', isStart: true }],
      [{ from: 'q0', to: 'q0', symbol: '0' }]
    );
    const errors = validateDFA(dfa);
    // Only warnings (missing transitions), no errors
    expect(hasBlockingErrors(errors)).toBe(false);
  });
});
