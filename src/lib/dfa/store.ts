import { create } from 'zustand';
import { DFA, DFAState, DFATransition, MinimizationResult, TestResult } from './types';
import { minimizeDFA, testString as testStringAlgo } from './algorithms';

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

  // String testing
  testString: string;
  testResult: TestResult | null;
  currentTestStep: number;
  isTesting: boolean;

  // Actions - States
  addState: (x: number, y: number) => void;
  removeState: (id: string) => void;
  updateStatePosition: (id: string, x: number, y: number) => void;
  toggleStartState: (id: string) => void;
  toggleFinalState: (id: string) => void;
  renameState: (id: string, label: string) => void;

  // Actions - Transitions
  addTransition: (from: string, to: string, symbol: string) => void;
  /** Add a transition and immediately open the symbol picker for it */
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

  // Actions - Bulk
  resetDFA: () => void;
  loadExample: () => void;
}

let stateCounter = 0;
let transitionCounter = 0;

const getNewStateId = () => `q${stateCounter++}`;
const getNewTransitionId = () => `t${transitionCounter++}`;

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
  testString: '',
  testResult: null,
  currentTestStep: 0,
  isTesting: false,

  addState: (x, y) => {
    const id = getNewStateId();
    const isFirst = get().states.length === 0;
    set(state => ({
      states: [...state.states, {
        id,
        label: id,
        x,
        y,
        isStart: isFirst,
        isFinal: false,
      }],
      minimizationResult: null, // invalidate on structural change
    }));
  },

  removeState: (id) => {
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
    set(state => ({
      states: state.states.map(s => ({
        ...s,
        // Toggle the clicked state; clear start on others
        isStart: s.id === id ? !s.isStart : false,
      })),
      minimizationResult: null,
    }));
  },

  toggleFinalState: (id) => {
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

  addTransition: (from, to, symbol) => {
    // Replace existing transition from→symbol if it exists
    set(state => {
      const filtered = state.transitions.filter(
        t => !(t.from === from && t.symbol === symbol)
      );
      return {
        transitions: [...filtered, {
          id: getNewTransitionId(),
          from,
          to,
          symbol,
        }],
        minimizationResult: null,
      };
    });
  },

  addTransitionAndEdit: (from, to) => {
    // Add a transition with the first alphabet symbol, then open the picker
    const { alphabet } = get();
    const symbol = alphabet[0] || 'a';
    const id = getNewTransitionId();
    const newTransition: DFATransition = { id, from, to, symbol };

    set(state => {
      // Replace any existing transition from→symbol
      const filtered = state.transitions.filter(
        t => !(t.from === from && t.symbol === symbol)
      );
      return {
        transitions: [...filtered, newTransition],
        editingTransition: newTransition, // open picker immediately
        connectingFrom: null,
        minimizationResult: null,
      };
    });
  },

  removeTransition: (id) => {
    set(state => ({
      transitions: state.transitions.filter(t => t.id !== id),
      minimizationResult: null,
    }));
  },

  updateTransitionSymbol: (id, symbol) => {
    set(state => {
      const target = state.transitions.find(t => t.id === id);
      if (!target) return state;

      // Remove duplicate (from→symbol) if another transition already uses that symbol
      const filtered = state.transitions.filter(
        t => t.id === id || !(t.from === target.from && t.symbol === symbol)
      );
      return {
        transitions: filtered.map(t => t.id === id ? { ...t, symbol } : t),
        minimizationResult: null,
      };
    });
  },

  addSymbol: (symbol) => {
    set(state => {
      if (state.alphabet.includes(symbol)) return state;
      return { alphabet: [...state.alphabet, symbol] };
    });
  },

  removeSymbol: (symbol) => {
    set(state => ({
      alphabet: state.alphabet.filter(s => s !== symbol),
      transitions: state.transitions.filter(t => t.symbol !== symbol),
      minimizationResult: null,
    }));
  },

  setMode: (mode) => set({ mode, selectedStateId: null, connectingFrom: null }),
  setSelectedState: (id) => set({ selectedStateId: id }),
  setConnectingFrom: (id) => set({ connectingFrom: id }),
  setEditingTransition: (t) => set({ editingTransition: t }),

  minimize: () => {
    const { states, transitions, alphabet } = get();
    const dfa: DFA = { states, transitions, alphabet };
    const result = minimizeDFA(dfa);
    set({
      minimizationResult: result,
      currentStep: 0,
      showMinimized: false,
    });
  },

  setStep: (step) => set({ currentStep: step }),
  setShowMinimized: (show) => set({ showMinimized: show }),
  resetMinimization: () => set({ minimizationResult: null, currentStep: 0, showMinimized: false }),

  setTestString: (str) => set({ testString: str, testResult: null, currentTestStep: 0 }),

  runTest: () => {
    const { states, transitions, alphabet, testString } = get();
    const dfa: DFA = { states, transitions, alphabet };
    const result = testStringAlgo(dfa, testString);
    set({ testResult: result, currentTestStep: result.steps.length - 1, isTesting: false });
  },

  setCurrentTestStep: (step) => set({ currentTestStep: step }),
  setIsTesting: (val) => set({ isTesting: val }),

  // ── Export/Import ──────────────────────────────
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
      // Reset counters so new states won't collide
      const maxStateNum = parsed.states.reduce((max, s) => {
        const match = s.id.match(/^q(\d+)$/);
        return match ? Math.max(max, parseInt(match[1]) + 1) : max;
      }, 0);
      const maxTransNum = parsed.transitions.reduce((max, t) => {
        const match = t.id.match(/^t(\d+)$/);
        return match ? Math.max(max, parseInt(match[1]) + 1) : max;
      }, 0);
      stateCounter = maxStateNum;
      transitionCounter = maxTransNum;

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
      });
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to parse JSON.' };
    }
  },

  // ── Reset / Load Example ───────────────────────
  resetDFA: () => {
    stateCounter = 0;
    transitionCounter = 0;
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
    });
  },

  loadExample: () => {
    // Example: 5 states (q0–q4), 10 transitions (t0–t9)
    stateCounter = 5;  // BUG FIX: was 6, should be 5
    transitionCounter = 10; // BUG FIX: was 16, should be 10
    set({
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
    });
  },
}));
