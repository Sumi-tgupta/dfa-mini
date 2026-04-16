import { create } from 'zustand';
import { DFA, DFAState, DFATransition, MinimizationResult, TestResult } from './types';
import { minimizeDFA } from '@/features/dfa/algorithms/minimization';
import { testString as testStringAlgo } from '@/features/dfa/algorithms/simulation';
import { EXAMPLE_DFAS } from '@/features/dfa/examples/library';
import type { ValidationError } from '@/features/dfa/types/dfa';

// ─── History for Undo/Redo ──────────────────────────────

interface HistorySnapshot {
  states: DFAState[];
  transitions: DFATransition[];
  alphabet: string[];
}

interface DFAStore {
  // DFA definition
  states: DFAState[];
  transitions: DFATransition[];
  alphabet: string[];

  // UI state
  selectedStateId: string | null;
  connectingFrom: string | null;
  mode: 'select' | 'add-state' | 'connect' | 'delete';
  editingTransition: DFATransition | null;

  // Minimization
  minimizationResult: MinimizationResult | null;
  currentStep: number;
  showMinimized: boolean;

  // Validation
  validationErrors: ValidationError[];

  // String testing
  testString: string;
  testResult: TestResult | null;
  currentTestStep: number;
  isTesting: boolean;

  // Undo/Redo
  history: HistorySnapshot[];
  historyIndex: number;

  // ID counters (inside store to survive SSR)
  _stateCounter: number;
  _transitionCounter: number;

  // Actions - States
  addState: (x: number, y: number) => void;
  removeState: (id: string) => void;
  updateStatePosition: (id: number | string, x: number, y: number) => void;
  toggleStartState: (id: string) => void;
  toggleFinalState: (id: string) => void;
  renameState: (id: string, label: string) => void;

  // Actions - Transitions
  addTransition: (from: string, to: string, symbol: string) => void;
  addTransitionAndEdit: (from: string, to: string) => void;
  removeTransition: (id: string) => void;
  updateTransitionSymbol: (id: string, symbol: string) => void;

  // Actions - Alphabet
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;

  // Actions - UI
  setMode: (mode: 'select' | 'add-state' | 'connect' | 'delete') => void;
  setSelectedState: (id: string | null) => void;
  setConnectingFrom: (id: string | null) => void;
  setEditingTransition: (t: DFATransition | null) => void;

  // Actions - Minimization
  minimize: () => void;
  setStep: (step: number) => void;
  setShowMinimized: (show: boolean) => void;
  resetMinimization: () => void;

  // Actions - Testing
  setTestString: (str: string) => void;
  runTest: () => void;
  setCurrentTestStep: (step: number) => void;
  setIsTesting: (val: boolean) => void;

  // Actions - Import/Export
  exportDFA: () => string;
  importDFA: (json: string) => { success: boolean; error?: string };

  // Actions - Undo/Redo
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Actions - Bulk
  resetDFA: () => void;
  loadExample: (idOrIndex?: string | number) => void;
}

function makeSnapshot(state: { states: DFAState[]; transitions: DFATransition[]; alphabet: string[] }): HistorySnapshot {
  return {
    states: state.states.map(s => ({ ...s })),
    transitions: state.transitions.map(t => ({ ...t })),
    alphabet: [...state.alphabet],
  };
}

const MAX_HISTORY = 50;

export const useDFAStore = create<DFAStore>((set, get) => ({
  states: [],
  transitions: [],
  alphabet: ['0', '1'],
  selectedStateId: null,
  connectingFrom: null,
  mode: 'select',
  editingTransition: null,
  minimizationResult: null,
  currentStep: 0,
  showMinimized: false,
  validationErrors: [],
  testString: '',
  testResult: null,
  currentTestStep: 0,
  isTesting: false,
  history: [],
  historyIndex: -1,
  _stateCounter: 0,
  _transitionCounter: 0,

  // ── Undo/Redo ──────────────────────────────────────

  pushHistory: () => {
    const s = get();
    const snapshot = makeSnapshot(s);
    const history = s.history.slice(0, s.historyIndex + 1);
    history.push(snapshot);
    if (history.length > MAX_HISTORY) history.shift();
    set({ history, historyIndex: history.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const snapshot = history[newIndex];
    set({
      states: snapshot.states.map(s => ({ ...s })),
      transitions: snapshot.transitions.map(t => ({ ...t })),
      alphabet: [...snapshot.alphabet],
      historyIndex: newIndex,
      minimizationResult: null,
      testResult: null,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const snapshot = history[newIndex];
    set({
      states: snapshot.states.map(s => ({ ...s })),
      transitions: snapshot.transitions.map(t => ({ ...t })),
      alphabet: [...snapshot.alphabet],
      historyIndex: newIndex,
      minimizationResult: null,
      testResult: null,
    });
  },

  // ── States ─────────────────────────────────────────

  addState: (x, y) => {
    const s = get();
    s.pushHistory();
    const id = `q${s._stateCounter}`;
    const isFirst = s.states.length === 0;
    set({
      states: [...s.states, {
        id,
        label: id,
        x,
        y,
        isStart: isFirst,
        isFinal: false,
      }],
      _stateCounter: s._stateCounter + 1,
      minimizationResult: null,
    });
  },

  removeState: (id) => {
    get().pushHistory();
    set(state => ({
      states: state.states.filter(s => s.id !== id),
      transitions: state.transitions.filter(t => t.from !== id && t.to !== id),
      selectedStateId: state.selectedStateId === id ? null : state.selectedStateId,
      connectingFrom: state.connectingFrom === id ? null : state.connectingFrom,
      minimizationResult: null,
    }));
  },

  updateStatePosition: (id, x, y) => {
    set(state => ({
      states: state.states.map(s => s.id === id ? { ...s, x, y } : s),
    }));
  },

  toggleStartState: (id) => {
    get().pushHistory();
    set(state => ({
      states: state.states.map(s => ({
        ...s,
        isStart: s.id === id ? !s.isStart : false,
      })),
      minimizationResult: null,
    }));
  },

  toggleFinalState: (id) => {
    get().pushHistory();
    set(state => ({
      states: state.states.map(s =>
        s.id === id ? { ...s, isFinal: !s.isFinal } : s
      ),
      minimizationResult: null,
    }));
  },

  renameState: (id, label) => {
    set(state => ({
      states: state.states.map(s =>
        s.id === id ? { ...s, label } : s
      ),
    }));
  },

  // ── Transitions ────────────────────────────────────

  addTransition: (from, to, symbol) => {
    get().pushHistory();
    set(state => {
      const filtered = state.transitions.filter(
        t => !(t.from === from && t.symbol === symbol)
      );
      const id = `t${state._transitionCounter}`;
      return {
        transitions: [...filtered, { id, from, to, symbol }],
        _transitionCounter: state._transitionCounter + 1,
        minimizationResult: null,
      };
    });
  },

  addTransitionAndEdit: (from, to) => {
    const { alphabet } = get();
    const symbol = alphabet[0] || 'a';
    get().pushHistory();

    set(state => {
      const id = `t${state._transitionCounter}`;
      const newTransition: DFATransition = { id, from, to, symbol };
      const filtered = state.transitions.filter(
        t => !(t.from === from && t.symbol === symbol)
      );
      return {
        transitions: [...filtered, newTransition],
        editingTransition: newTransition,
        connectingFrom: null,
        _transitionCounter: state._transitionCounter + 1,
        minimizationResult: null,
      };
    });
  },

  removeTransition: (id) => {
    get().pushHistory();
    set(state => ({
      transitions: state.transitions.filter(t => t.id !== id),
      minimizationResult: null,
    }));
  },

  updateTransitionSymbol: (id, symbol) => {
    set(state => {
      const target = state.transitions.find(t => t.id === id);
      if (!target) return state;
      const filtered = state.transitions.filter(
        t => t.id === id || !(t.from === target.from && t.symbol === symbol)
      );
      return {
        transitions: filtered.map(t => t.id === id ? { ...t, symbol } : t),
        minimizationResult: null,
      };
    });
  },

  // ── Alphabet ───────────────────────────────────────

  addSymbol: (symbol) => {
    set(state => {
      if (state.alphabet.includes(symbol)) return state;
      return { alphabet: [...state.alphabet, symbol] };
    });
  },

  removeSymbol: (symbol) => {
    get().pushHistory();
    set(state => ({
      alphabet: state.alphabet.filter(s => s !== symbol),
      transitions: state.transitions.filter(t => t.symbol !== symbol),
      minimizationResult: null,
    }));
  },

  // ── UI ─────────────────────────────────────────────

  setMode: (mode) => set({ mode, selectedStateId: null, connectingFrom: null }),
  setSelectedState: (id) => set({ selectedStateId: id }),
  setConnectingFrom: (id) => set({ connectingFrom: id }),
  setEditingTransition: (t) => set({ editingTransition: t }),

  // ── Minimization ───────────────────────────────────

  minimize: () => {
    const { states, transitions, alphabet } = get();
    const dfa: DFA = { states, transitions, alphabet };
    const result = minimizeDFA(dfa);
    set({
      minimizationResult: result,
      currentStep: 0,
      showMinimized: false,
      validationErrors: result.validationErrors ?? [],
    });
  },

  setStep: (step) => set({ currentStep: step }),
  setShowMinimized: (show) => set({ showMinimized: show }),
  resetMinimization: () => set({ minimizationResult: null, currentStep: 0, showMinimized: false, validationErrors: [] }),

  // ── Testing ────────────────────────────────────────

  setTestString: (str) => set({ testString: str, testResult: null, currentTestStep: 0 }),

  runTest: () => {
    const { states, transitions, alphabet, testString, showMinimized, minimizationResult } = get();
    const dfaStates = showMinimized && minimizationResult?.minimizedDFA
      ? minimizationResult.minimizedDFA.states : states;
    const dfaTransitions = showMinimized && minimizationResult?.minimizedDFA
      ? minimizationResult.minimizedDFA.transitions : transitions;
    const dfa: DFA = { states: dfaStates, transitions: dfaTransitions, alphabet };
    const result = testStringAlgo(dfa, testString);
    set({ testResult: result, currentTestStep: result.steps.length - 1, isTesting: false });
  },

  setCurrentTestStep: (step) => set({ currentTestStep: step }),
  setIsTesting: (val) => set({ isTesting: val }),

  // ── Export/Import ──────────────────────────────────

  exportDFA: () => {
    const { states, transitions, alphabet } = get();
    return JSON.stringify({ states, transitions, alphabet }, null, 2);
  },

  importDFA: (json) => {
    try {
      const parsed = JSON.parse(json) as DFA;
      if (!Array.isArray(parsed.states) || !Array.isArray(parsed.transitions) || !Array.isArray(parsed.alphabet)) {
        return { success: false, error: 'Invalid DFA JSON: missing states, transitions, or alphabet.' };
      }

      // Compute new counter values from imported IDs
      const maxStateNum = parsed.states.reduce((max, s) => {
        const match = s.id.match(/^q(\d+)$/);
        return match ? Math.max(max, parseInt(match[1]) + 1) : max;
      }, 0);
      const maxTransNum = parsed.transitions.reduce((max, t) => {
        const match = t.id.match(/^t(\d+)$/);
        return match ? Math.max(max, parseInt(match[1]) + 1) : max;
      }, 0);

      set({
        states: parsed.states,
        transitions: parsed.transitions,
        alphabet: parsed.alphabet,
        selectedStateId: null,
        connectingFrom: null,
        mode: 'select',
        minimizationResult: null,
        currentStep: 0,
        showMinimized: false,
        testString: '',
        testResult: null,
        currentTestStep: 0,
        isTesting: false,
        validationErrors: [],
        _stateCounter: maxStateNum,
        _transitionCounter: maxTransNum,
        history: [],
        historyIndex: -1,
      });
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to parse JSON.' };
    }
  },

  // ── Reset / Load Example ───────────────────────────

  resetDFA: () => {
    set({
      states: [],
      transitions: [],
      alphabet: ['0', '1'],
      selectedStateId: null,
      connectingFrom: null,
      mode: 'select',
      minimizationResult: null,
      currentStep: 0,
      showMinimized: false,
      testString: '',
      testResult: null,
      currentTestStep: 0,
      isTesting: false,
      validationErrors: [],
      _stateCounter: 0,
      _transitionCounter: 0,
      history: [],
      historyIndex: -1,
    });
  },

  loadExample: (idOrIndex?: string | number) => {
    let example;
    if (typeof idOrIndex === 'number') {
      example = EXAMPLE_DFAS[idOrIndex];
    } else {
      example = idOrIndex
        ? EXAMPLE_DFAS.find(e => e.id === idOrIndex)
        : EXAMPLE_DFAS[0];
    }

    if (!example) return;

    const { dfa } = example;

    // Compute counter values
    const maxStateNum = dfa.states.reduce((max, s) => {
      const match = s.id.match(/^q(\d+)$/);
      return match ? Math.max(max, parseInt(match[1]) + 1) : max;
    }, 0);
    const maxTransNum = dfa.transitions.reduce((max, t) => {
      const match = t.id.match(/^t(\d+)$/);
      return match ? Math.max(max, parseInt(match[1]) + 1) : max;
    }, 0);

    set({
      states: dfa.states.map(s => ({ ...s })),
      transitions: dfa.transitions.map(t => ({ ...t })),
      alphabet: [...dfa.alphabet],
      selectedStateId: null,
      connectingFrom: null,
      mode: 'select',
      minimizationResult: null,
      currentStep: 0,
      showMinimized: false,
      testString: '',
      testResult: null,
      currentTestStep: 0,
      isTesting: false,
      validationErrors: [],
      _stateCounter: maxStateNum,
      _transitionCounter: maxTransNum,
      history: [],
      historyIndex: -1,
    });
  },
}));
