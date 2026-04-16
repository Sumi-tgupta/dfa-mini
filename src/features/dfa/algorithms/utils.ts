// ═══════════════════════════════════════════════════════════
// Shared Algorithm Utilities
// ═══════════════════════════════════════════════════════════

import { DFA, DFAState, DFATransition, DEAD_STATE_ID, DEAD_STATE_LABEL } from '../types/dfa';

// ─── Reachability Analysis ──────────────────────────────

/**
 * Returns the set of state IDs reachable from the start state via BFS.
 */
export function getReachableStates(dfa: DFA): Set<string> {
  const start = dfa.states.find(s => s.isStart);
  if (!start) return new Set();

  const reachable = new Set<string>();
  const queue: string[] = [start.id];
  reachable.add(start.id);

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

/**
 * Remove unreachable states and their transitions from a DFA.
 * Returns the pruned DFA and the list of removed state IDs.
 */
export function removeUnreachableStates(dfa: DFA): { dfa: DFA; removed: string[] } {
  const reachable = getReachableStates(dfa);
  const removed = dfa.states.filter(s => !reachable.has(s.id)).map(s => s.id);

  if (removed.length === 0) return { dfa, removed: [] };

  return {
    dfa: {
      states: dfa.states.filter(s => reachable.has(s.id)),
      transitions: dfa.transitions.filter(t => reachable.has(t.from) && reachable.has(t.to)),
      alphabet: [...dfa.alphabet],
    },
    removed,
  };
}

// ─── Make DFA Total (inject Dead State) ─────────────────

/**
 * Ensures every state has a transition for every symbol.
 * Adds a dead/trap state if any transitions are missing.
 * Returns the completed DFA and whether a dead state was added.
 */
export function makeDFATotal(dfa: DFA): { dfa: DFA; deadStateAdded: boolean } {
  const stateIds = new Set(dfa.states.map(s => s.id));
  const transitionMap = new Map<string, string>(); // "stateId-symbol" → targetId

  for (const t of dfa.transitions) {
    transitionMap.set(`${t.from}-${t.symbol}`, t.to);
  }

  let needsDeadState = false;
  const missingTransitions: DFATransition[] = [];
  let transId = dfa.transitions.length;

  for (const state of dfa.states) {
    for (const symbol of dfa.alphabet) {
      const key = `${state.id}-${symbol}`;
      if (!transitionMap.has(key)) {
        needsDeadState = true;
        missingTransitions.push({
          id: `td${transId++}`,
          from: state.id,
          to: DEAD_STATE_ID,
          symbol,
        });
      }
    }
  }

  if (!needsDeadState) {
    return { dfa, deadStateAdded: false };
  }

  // Build dead state — self-loops on all symbols
  const deadState: DFAState = {
    id: DEAD_STATE_ID,
    label: DEAD_STATE_LABEL,
    x: 0,
    y: 0,
    isStart: false,
    isFinal: false,
  };

  const deadSelfLoops: DFATransition[] = dfa.alphabet.map((symbol, i) => ({
    id: `td${transId + i}`,
    from: DEAD_STATE_ID,
    to: DEAD_STATE_ID,
    symbol,
  }));

  return {
    dfa: {
      states: [...dfa.states, deadState],
      transitions: [...dfa.transitions, ...missingTransitions, ...deadSelfLoops],
      alphabet: [...dfa.alphabet],
    },
    deadStateAdded: true,
  };
}

// ─── Transition Lookup ──────────────────────────────────

/**
 * Build a fast transition lookup map: "stateId-symbol" → targetStateId
 */
export function buildTransitionMap(transitions: DFATransition[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of transitions) {
    map.set(`${t.from}-${t.symbol}`, t.to);
  }
  return map;
}

// ─── Union-Find ─────────────────────────────────────────

export class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // path compression
    }
    return this.parent[x];
  }

  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;

    // union by rank
    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb;
    } else if (this.rank[ra] > this.rank[rb]) {
      this.parent[rb] = ra;
    } else {
      this.parent[rb] = ra;
      this.rank[ra]++;
    }
  }

  /**
   * Returns equivalence classes as arrays of indices grouped by root.
   */
  getClasses(): Map<number, number[]> {
    const classes = new Map<number, number[]>();
    for (let i = 0; i < this.parent.length; i++) {
      const root = this.find(i);
      if (!classes.has(root)) classes.set(root, []);
      classes.get(root)!.push(i);
    }
    return classes;
  }
}

// ─── Auto-Layout ────────────────────────────────────────

/**
 * Place states in a circle for auto-layout of minimized DFA.
 */
export function autoLayout(
  stateIds: string[],
  canvasW = 720,
  canvasH = 420
): Map<string, { x: number; y: number }> {
  const n = stateIds.length;
  const positions = new Map<string, { x: number; y: number }>();
  if (n === 0) return positions;

  if (n === 1) {
    positions.set(stateIds[0], { x: canvasW / 2, y: canvasH / 2 });
    return positions;
  }

  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const radius = Math.min(cx, cy) * 0.6;

  stateIds.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions.set(id, {
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle)),
    });
  });

  return positions;
}

/**
 * Get a state's display label by its ID from a DFA.
 */
export function getStateLabel(dfa: DFA, stateId: string): string {
  return dfa.states.find(s => s.id === stateId)?.label ?? stateId;
}
