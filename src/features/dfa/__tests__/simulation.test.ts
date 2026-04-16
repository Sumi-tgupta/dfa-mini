// ═══════════════════════════════════════════════════════════
// String Simulation Tests
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { simulateString, testString } from '../algorithms/simulation';
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

// A simple DFA that accepts strings ending with '1'
const endsWith1 = makeDFA(
  [
    { id: 'q0', isStart: true },
    { id: 'q1', isFinal: true },
  ],
  [
    { from: 'q0', to: 'q0', symbol: '0' },
    { from: 'q0', to: 'q1', symbol: '1' },
    { from: 'q1', to: 'q0', symbol: '0' },
    { from: 'q1', to: 'q1', symbol: '1' },
  ]
);

describe('String Simulation', () => {
  it('should accept a string that ends with 1', () => {
    const result = simulateString(endsWith1, '01');
    expect(result.accepted).toBe(true);
    expect(result.steps.length).toBe(3); // initial + 2 symbols
  });

  it('should reject a string that ends with 0', () => {
    const result = simulateString(endsWith1, '10');
    expect(result.accepted).toBe(false);
  });

  it('should accept empty string when start state is final', () => {
    const dfa = makeDFA(
      [{ id: 'q0', isStart: true, isFinal: true }],
      [
        { from: 'q0', to: 'q0', symbol: '0' },
        { from: 'q0', to: 'q0', symbol: '1' },
      ]
    );
    const result = simulateString(dfa, '');
    expect(result.accepted).toBe(true);
    expect(result.steps.length).toBe(1);
  });

  it('should reject empty string when start state is not final', () => {
    const result = simulateString(endsWith1, '');
    expect(result.accepted).toBe(false);
    expect(result.steps.length).toBe(1);
  });

  it('should handle missing transitions gracefully', () => {
    const dfa = makeDFA(
      [
        { id: 'q0', isStart: true },
        { id: 'q1', isFinal: true },
      ],
      [
        { from: 'q0', to: 'q1', symbol: '0' },
        // Missing: q0 on '1', q1 on '0', q1 on '1'
      ]
    );
    const result = simulateString(dfa, '1');
    expect(result.accepted).toBe(false);
    // Should still have steps (stuck step)
    expect(result.steps.length).toBeGreaterThanOrEqual(1);
  });

  it('should return error when no start state', () => {
    const dfa = makeDFA(
      [{ id: 'q0' }],
      [{ from: 'q0', to: 'q0', symbol: '0' }]
    );
    const result = simulateString(dfa, '0');
    expect(result.accepted).toBe(false);
    expect(result.rejectionReason).toContain('start state');
  });

  it('should track consumed and remaining correctly', () => {
    const result = simulateString(endsWith1, '011');
    // Steps: q0(|011), q0(0|11), q1(01|1), q1(011|)
    expect(result.steps[0].consumed).toBe('');
    expect(result.steps[0].remaining).toBe('011');
    expect(result.steps[1].consumed).toBe('0');
    expect(result.steps[1].remaining).toBe('11');
    expect(result.steps[3].consumed).toBe('011');
    expect(result.steps[3].remaining).toBe('');
  });

  it('legacy testString wrapper should work', () => {
    const result = testString(endsWith1, '01');
    expect(result.accepted).toBe(true);
    expect(result.steps.length).toBe(3);
    // Last step should be marked as current
    expect(result.steps[result.steps.length - 1].isCurrent).toBe(true);
  });

  it('should correctly simulate a long string', () => {
    const result = simulateString(endsWith1, '0101010101');
    expect(result.accepted).toBe(true);
    expect(result.steps.length).toBe(11); // 10 symbols + initial
  });
});
