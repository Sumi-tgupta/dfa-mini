// ═══════════════════════════════════════════════════════════
// Example DFA Library — Curated automata for learning & testing
// ═══════════════════════════════════════════════════════════

import { ExampleDFA } from '../types/dfa';

export const EXAMPLE_DFAS: ExampleDFA[] = [
  {
    id: 'basic-5state',
    name: 'Classic 5-State',
    description: '5 states with 2 equivalent final states and 2 equivalent non-final states',
    language: 'L = {w ∈ {0,1}* | w has length ≥ 2}',
    expectedMinStates: 3,
    dfa: {
      states: [
        { id: 'q0', label: 'q0', x: 120, y: 200, isStart: true,  isFinal: false },
        { id: 'q1', label: 'q1', x: 320, y: 120, isStart: false, isFinal: false },
        { id: 'q2', label: 'q2', x: 320, y: 280, isStart: false, isFinal: false },
        { id: 'q3', label: 'q3', x: 520, y: 120, isStart: false, isFinal: true  },
        { id: 'q4', label: 'q4', x: 520, y: 280, isStart: false, isFinal: true  },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q2', symbol: '1' },
        { id: 't2', from: 'q1', to: 'q3', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q4', symbol: '1' },
        { id: 't4', from: 'q2', to: 'q4', symbol: '0' },
        { id: 't5', from: 'q2', to: 'q3', symbol: '1' },
        { id: 't6', from: 'q3', to: 'q3', symbol: '0' },
        { id: 't7', from: 'q3', to: 'q3', symbol: '1' },
        { id: 't8', from: 'q4', to: 'q3', symbol: '0' },
        { id: 't9', from: 'q4', to: 'q3', symbol: '1' },
      ],
      alphabet: ['0', '1'],
    },
  },

  {
    id: 'already-minimal',
    name: 'Already Minimal',
    description: 'A DFA that is already in minimal form — 3 distinct states',
    language: 'L = {w ∈ {0,1}* | w ends with 1}',
    expectedMinStates: 2,
    dfa: {
      states: [
        { id: 'q0', label: 'A', x: 200, y: 210, isStart: true,  isFinal: false },
        { id: 'q1', label: 'B', x: 500, y: 210, isStart: false, isFinal: true  },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q0', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q1', symbol: '1' },
        { id: 't2', from: 'q1', to: 'q0', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q1', symbol: '1' },
      ],
      alphabet: ['0', '1'],
    },
  },

  {
    id: 'unreachable-states',
    name: 'Unreachable States',
    description: 'DFA with 2 unreachable states that should be removed during minimization',
    language: 'L = {w ∈ {0,1}* | |w| ≥ 1}',
    expectedMinStates: 2,
    dfa: {
      states: [
        { id: 'q0', label: 'q0', x: 120, y: 210, isStart: true,  isFinal: false },
        { id: 'q1', label: 'q1', x: 350, y: 210, isStart: false, isFinal: true  },
        { id: 'q2', label: 'q2', x: 350, y: 380, isStart: false, isFinal: false },
        { id: 'q3', label: 'q3', x: 550, y: 380, isStart: false, isFinal: true  },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q1', symbol: '1' },
        { id: 't2', from: 'q1', to: 'q1', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q1', symbol: '1' },
        { id: 't4', from: 'q2', to: 'q3', symbol: '0' },
        { id: 't5', from: 'q2', to: 'q0', symbol: '1' },
        { id: 't6', from: 'q3', to: 'q3', symbol: '0' },
        { id: 't7', from: 'q3', to: 'q2', symbol: '1' },
      ],
      alphabet: ['0', '1'],
    },
  },

  {
    id: 'all-accepting',
    name: 'All Accepting',
    description: 'Every state is an accepting state — tests the all-final edge case',
    language: 'L = Σ* (accepts everything)',
    expectedMinStates: 1,
    dfa: {
      states: [
        { id: 'q0', label: 'q0', x: 200, y: 150, isStart: true,  isFinal: true },
        { id: 'q1', label: 'q1', x: 400, y: 150, isStart: false, isFinal: true },
        { id: 'q2', label: 'q2', x: 300, y: 300, isStart: false, isFinal: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q2', symbol: '1' },
        { id: 't2', from: 'q1', to: 'q0', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q2', symbol: '1' },
        { id: 't4', from: 'q2', to: 'q0', symbol: '0' },
        { id: 't5', from: 'q2', to: 'q1', symbol: '1' },
      ],
      alphabet: ['0', '1'],
    },
  },

  {
    id: 'no-accepting',
    name: 'No Accepting',
    description: 'No accepting states — tests the no-final edge case. Rejects all strings.',
    language: 'L = ∅ (rejects everything)',
    expectedMinStates: 1,
    dfa: {
      states: [
        { id: 'q0', label: 'q0', x: 200, y: 210, isStart: true,  isFinal: false },
        { id: 'q1', label: 'q1', x: 500, y: 210, isStart: false, isFinal: false },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q1', symbol: '1' },
        { id: 't2', from: 'q1', to: 'q0', symbol: '0' },
        { id: 't3', from: 'q1', to: 'q0', symbol: '1' },
      ],
      alphabet: ['0', '1'],
    },
  },

  {
    id: 'single-state',
    name: 'Single State',
    description: 'A minimal DFA with just one accepting state and self-loops',
    language: 'L = Σ*',
    expectedMinStates: 1,
    dfa: {
      states: [
        { id: 'q0', label: 'q0', x: 360, y: 210, isStart: true, isFinal: true },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q0', symbol: '0' },
        { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
      ],
      alphabet: ['0', '1'],
    },
  },

  {
    id: 'missing-transitions',
    name: 'Incomplete DFA',
    description: 'A DFA with missing transitions — tests trap/dead state injection',
    language: 'L = {w ∈ {a,b}* | w starts with "a"}',
    expectedMinStates: 3,
    dfa: {
      states: [
        { id: 'q0', label: 'S', x: 150, y: 210, isStart: true,  isFinal: false },
        { id: 'q1', label: 'A', x: 400, y: 210, isStart: false, isFinal: true  },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: 'a' },
        // Missing: q0 on 'b', q1 on 'a', q1 on 'b'
        { id: 't1', from: 'q1', to: 'q1', symbol: 'a' },
        { id: 't2', from: 'q1', to: 'q1', symbol: 'b' },
      ],
      alphabet: ['a', 'b'],
    },
  },

  {
    id: 'three-symbol',
    name: 'Three-Symbol Alphabet',
    description: 'DFA over alphabet {a, b, c} with multiple equivalent states',
    language: 'L = {w ∈ {a,b,c}* | w contains "a"}',
    expectedMinStates: 2,
    dfa: {
      states: [
        { id: 'q0', label: 'q0', x: 150, y: 210, isStart: true,  isFinal: false },
        { id: 'q1', label: 'q1', x: 400, y: 130, isStart: false, isFinal: true  },
        { id: 'q2', label: 'q2', x: 400, y: 290, isStart: false, isFinal: true  },
      ],
      transitions: [
        { id: 't0', from: 'q0', to: 'q1', symbol: 'a' },
        { id: 't1', from: 'q0', to: 'q0', symbol: 'b' },
        { id: 't2', from: 'q0', to: 'q0', symbol: 'c' },
        { id: 't3', from: 'q1', to: 'q1', symbol: 'a' },
        { id: 't4', from: 'q1', to: 'q2', symbol: 'b' },
        { id: 't5', from: 'q1', to: 'q2', symbol: 'c' },
        { id: 't6', from: 'q2', to: 'q2', symbol: 'a' },
        { id: 't7', from: 'q2', to: 'q1', symbol: 'b' },
        { id: 't8', from: 'q2', to: 'q1', symbol: 'c' },
      ],
      alphabet: ['a', 'b', 'c'],
    },
  },
];

export function getExampleById(id: string): ExampleDFA | undefined {
  return EXAMPLE_DFAS.find(e => e.id === id);
}
