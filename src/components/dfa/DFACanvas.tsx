'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDFAStore } from '@/lib/dfa/store';
import { motion, AnimatePresence } from 'framer-motion';
import { DFAState, DFATransition } from '@/lib/dfa/types';

const STATE_RADIUS = 32;
const ARROW_SIZE = 10;

// ──────────────────────────────────────────
// Arrow marker definitions
// ──────────────────────────────────────────
function ArrowMarkers() {
  return (
    <defs>
      <marker id="arrowhead" markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE}
        refX={ARROW_SIZE - 1} refY={ARROW_SIZE / 2} orient="auto" markerUnits="strokeWidth">
        <path d={`M 0 0 L ${ARROW_SIZE} ${ARROW_SIZE / 2} L 0 ${ARROW_SIZE} Z`}
          className="fill-primary" opacity={0.8} />
      </marker>
      <marker id="arrowhead-highlight" markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE}
        refX={ARROW_SIZE - 1} refY={ARROW_SIZE / 2} orient="auto" markerUnits="strokeWidth">
        <path d={`M 0 0 L ${ARROW_SIZE} ${ARROW_SIZE / 2} L 0 ${ARROW_SIZE} Z`}
          className="fill-emerald-400" />
      </marker>
      <marker id="arrowhead-reject" markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE}
        refX={ARROW_SIZE - 1} refY={ARROW_SIZE / 2} orient="auto" markerUnits="strokeWidth">
        <path d={`M 0 0 L ${ARROW_SIZE} ${ARROW_SIZE / 2} L 0 ${ARROW_SIZE} Z`}
          className="fill-red-400" />
      </marker>
    </defs>
  );
}

// ──────────────────────────────────────────
// Group transitions: same (from, to) → merged label "0,1"
// ──────────────────────────────────────────
interface GroupedTransition {
  from: string;
  to: string;
  symbols: string[];
  ids: string[];
}

function groupTransitions(transitions: DFATransition[]): GroupedTransition[] {
  const map = new Map<string, GroupedTransition>();
  for (const t of transitions) {
    const key = `${t.from}->${t.to}`;
    if (!map.has(key)) {
      map.set(key, { from: t.from, to: t.to, symbols: [], ids: [] });
    }
    const group = map.get(key)!;
    group.symbols.push(t.symbol);
    group.ids.push(t.id);
  }
  return Array.from(map.values());
}

// ──────────────────────────────────────────
// Compute transition path (self-loop / curved / straight)
// ──────────────────────────────────────────
function getGroupedPath(
  from: DFAState,
  to: DFAState,
  allGrouped: GroupedTransition[],
): { path: string; labelX: number; labelY: number; isSelfLoop: boolean } {
  const R = STATE_RADIUS;

  if (from.id === to.id) {
    // Self-loop: render above the state
    return {
      path: `M ${from.x - R * 0.5} ${from.y - R * 0.85} C ${from.x - R * 1.5} ${from.y - R * 2.8} ${from.x + R * 1.5} ${from.y - R * 2.8} ${from.x + R * 0.5} ${from.y - R * 0.85}`,
      labelX: from.x,
      labelY: from.y - R * 2.3,
      isSelfLoop: true,
    };
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;
  const perpX = -ny;
  const perpY = nx;

  const hasReverse = allGrouped.some(g => g.from === to.id && g.to === from.id);

  const offset = hasReverse ? -20 : 0;

  const startX = from.x + nx * R + perpX * offset;
  const startY = from.y + ny * R + perpY * offset;
  const endX = to.x - nx * R + perpX * offset;
  const endY = to.y - ny * R + perpY * offset;

  if (offset !== 0) {
    const midX = (startX + endX) / 2 + perpX * Math.abs(offset) * 1.2;
    const midY = (startY + endY) / 2 + perpY * Math.abs(offset) * 1.2;
    return {
      path: `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`,
      labelX: midX,
      labelY: midY,
      isSelfLoop: false,
    };
  }

  return {
    path: `M ${startX} ${startY} L ${endX} ${endY}`,
    labelX: (startX + endX) / 2 + perpX * 16,
    labelY: (startY + endY) / 2 + perpY * 16,
    isSelfLoop: false,
  };
}

// ──────────────────────────────────────────
// Start arrow
// ──────────────────────────────────────────
function StartArrow({ state }: { state: DFAState }) {
  const R = STATE_RADIUS;
  return (
    <path
      d={`M ${state.x - R - 50} ${state.y} L ${state.x - R} ${state.y}`}
      className="stroke-primary"
      strokeWidth={2.5}
      markerEnd="url(#arrowhead)"
      opacity={0.8}
    />
  );
}

// ──────────────────────────────────────────
// Grouped Transition edge (merged labels)
// ──────────────────────────────────────────
function GroupedTransitionEdge({
  group, from, to, allGrouped, highlightedIds, onClick,
}: {
  group: GroupedTransition;
  from: DFAState;
  to: DFAState;
  allGrouped: GroupedTransition[];
  highlightedIds: Set<string>;
  onClick: (t: DFATransition) => void;
}) {
  const { path, labelX, labelY } = getGroupedPath(from, to, allGrouped);
  const isHighlighted = group.ids.some(id => highlightedIds.has(id));
  const markerUrl = isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)';
  const label = group.symbols.join(',');
  const labelWidth = Math.max(label.length * 8 + 12, 24);

  // Create a dummy transition for click handler
  const firstTransition: DFATransition = {
    id: group.ids[0],
    from: group.from,
    to: group.to,
    symbol: group.symbols[0],
  };

  return (
    <g className="cursor-pointer" onClick={() => onClick(firstTransition)}>
      <path
        d={path}
        className={isHighlighted ? 'stroke-emerald-400' : 'stroke-muted-foreground'}
        strokeWidth={isHighlighted ? 3 : 2}
        fill="none"
        markerEnd={markerUrl}
        opacity={isHighlighted ? 1 : 0.5}
        style={{ transition: 'all 0.3s ease' }}
      />
      {/* Wider invisible hit area */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={16} />
      <g transform={`translate(${labelX}, ${labelY})`}>
        <rect
          x={-labelWidth / 2} y={-10} width={labelWidth} height={20} rx={6}
          className="fill-background" opacity={0.9}
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          className={`fill-foreground text-xs font-mono font-bold ${isHighlighted ? 'fill-emerald-400' : ''}`}
          fontSize={12}
        >
          {label}
        </text>
      </g>
    </g>
  );
}

// ──────────────────────────────────────────
// State circle
// ──────────────────────────────────────────
function StateCircle({
  state, isSelected, isCurrentTestState, isAccepted,
  onDragStart, onClick, onDoubleClick,
}: {
  state: DFAState;
  isSelected: boolean;
  isCurrentTestState: boolean;
  isAccepted: boolean;
  onDragStart: (e: React.MouseEvent, state: DFAState) => void;
  onClick: (state: DFAState) => void;
  onDoubleClick: (state: DFAState) => void;
}) {
  const R = STATE_RADIUS;
  return (
    <g
      onMouseDown={(e) => onDragStart(e, state)}
      onClick={(e) => { e.stopPropagation(); onClick(state); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(state); }}
      className="cursor-grab active:cursor-grabbing"
    >
      <AnimatePresence>
        {(isSelected || isCurrentTestState) && (
          <motion.circle
            cx={state.x} cy={state.y} r={R + 8}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={isAccepted ? 'stroke-emerald-400' : isCurrentTestState ? 'stroke-red-400' : 'stroke-violet-500'}
            strokeWidth={2} fill="none" filter="url(#glow)"
          />
        )}
      </AnimatePresence>

      <circle
        cx={state.x} cy={state.y} r={R}
        className={
          isCurrentTestState
            ? isAccepted
              ? 'fill-emerald-500/20 stroke-emerald-400'
              : 'fill-red-500/20 stroke-red-400'
            : isSelected
            ? 'fill-violet-500/20 stroke-violet-400'
            : 'fill-card stroke-muted-foreground/60'
        }
        strokeWidth={2.5}
        style={{ transition: 'all 0.2s ease' }}
      />

      {state.isFinal && (
        <circle
          cx={state.x} cy={state.y} r={R - 6}
          className={
            isCurrentTestState
              ? isAccepted ? 'stroke-emerald-400' : 'stroke-red-400'
              : 'stroke-muted-foreground/60'
          }
          strokeWidth={2} fill="none"
          style={{ transition: 'all 0.2s ease' }}
        />
      )}

      <text
        x={state.x} y={state.y}
        textAnchor="middle" dominantBaseline="central"
        className={`fill-foreground font-mono font-semibold ${isCurrentTestState ? (isAccepted ? 'fill-emerald-300' : 'fill-red-300') : ''}`}
        fontSize={state.label.length > 4 ? 10 : 14}
        pointerEvents="none"
      >
        {state.label}
      </text>
    </g>
  );
}

// ──────────────────────────────────────────
// Connection line (while drawing a connection)
// ──────────────────────────────────────────
function ConnectionLine({ from, to }: { from: DFAState; to: { x: number; y: number } }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  return (
    <line
      x1={from.x + (dx / dist) * STATE_RADIUS}
      y1={from.y + (dy / dist) * STATE_RADIUS}
      x2={to.x} y2={to.y}
      className="stroke-violet-400"
      strokeWidth={2} strokeDasharray="6 4" opacity={0.7}
    />
  );
}

// ──────────────────────────────────────────
// Grid background
// ──────────────────────────────────────────
function GridBackground({ width, height }: { width: number; height: number }) {
  const step = 30;
  const lines: React.ReactElement[] = [];
  for (let x = 0; x <= width; x += step) {
    lines.push(<line key={`v-${x}`} x1={x} y1={0} x2={x} y2={height} className="stroke-border/30" strokeWidth={0.5} />);
  }
  for (let y = 0; y <= height; y += step) {
    lines.push(<line key={`h-${y}`} x1={0} y1={y} x2={width} y2={y} className="stroke-border/30" strokeWidth={0.5} />);
  }
  return <g>{lines}</g>;
}

// ──────────────────────────────────────────
// MAIN CANVAS
// ──────────────────────────────────────────
export default function DFACanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const {
    states, transitions, mode, selectedStateId, connectingFrom, alphabet,
    addState, removeState, toggleFinalState,
    setSelectedState, setConnectingFrom, addTransitionAndEdit,
    updateStatePosition, setEditingTransition,
    testResult, currentTestStep,
    testString,
  } = useDFAStore();

  // Group transitions for merged label rendering
  const groupedTransitions = groupTransitions(transitions);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      const el = svgRef.current?.parentElement;
      if (el) setDimensions({ width: el.clientWidth, height: el.clientHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute which transition to highlight
  const testStep = testResult?.steps[currentTestStep];
  const currentTestStateId = testStep ? testStep.state : null;
  const isAccepted = testStep?.isAccepted ?? false;

  const prevStep = currentTestStep > 0 ? testResult?.steps[currentTestStep - 1] : null;
  const highlightedTransitionIds = new Set<string>();
  if (prevStep) {
    const matching = transitions.find(
      t => t.from === prevStep.state && t.symbol === testString[currentTestStep - 1]
    );
    if (matching) highlightedTransitionIds.add(matching.id);
  }

  // Drag handlers
  const getSVGCoords = useCallback((e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent, state: DFAState) => {
    if (mode === 'select') {
      e.preventDefault();
      e.stopPropagation();
      setDragging(state.id);
      const coords = getSVGCoords(e);
      setDragOffset({ x: coords.x - state.x, y: coords.y - state.y });
      setSelectedState(state.id);
    }
  }, [mode, getSVGCoords, setSelectedState]);

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (dragging && mode === 'select') {
      const coords = getSVGCoords(e);
      updateStatePosition(dragging, coords.x - dragOffset.x, coords.y - dragOffset.y);
    }
  }, [dragging, dragOffset, mode, getSVGCoords, updateStatePosition]);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'add-state') {
      const coords = getSVGCoords(e);
      addState(coords.x, coords.y);
    } else {
      setSelectedState(null);
      setConnectingFrom(null);
    }
  }, [mode, getSVGCoords, addState, setSelectedState, setConnectingFrom]);

  const handleStateClick = useCallback((state: DFAState) => {
    if (mode === 'delete') {
      removeState(state.id);
    } else if (mode === 'connect') {
      if (!connectingFrom) {
        setConnectingFrom(state.id);
      } else if (connectingFrom !== state.id) {
        addTransitionAndEdit(connectingFrom, state.id);
        setConnectingFrom(null);
      } else {
        // clicked the same state → self-loop
        addTransitionAndEdit(state.id, state.id);
        setConnectingFrom(null);
      }
    } else if (mode === 'select') {
      setSelectedState(state.id);
    }
  }, [mode, connectingFrom, removeState, addTransitionAndEdit, setConnectingFrom, setSelectedState]);

  const handleDoubleClick = useCallback((state: DFAState) => {
    if (mode === 'select') toggleFinalState(state.id);
  }, [mode, toggleFinalState]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    setMousePos(getSVGCoords(e));
    handleDrag(e);
  }, [getSVGCoords, handleDrag]);

  const handleTransitionClick = useCallback((t: DFATransition) => {
    if (mode === 'delete') {
      useDFAStore.getState().removeTransition(t.id);
    } else if (mode === 'select') {
      setEditingTransition(t);
    }
  }, [mode, setEditingTransition]);

  // Delete key shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStateId &&
        !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        removeState(selectedStateId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStateId, removeState]);

  const connectingFromState = states.find(s => s.id === connectingFrom);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm" style={{ minHeight: 400 }}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onClick={handleSvgClick}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <ArrowMarkers />
        </defs>

        <GridBackground width={dimensions.width} height={dimensions.height} />

        {/* Grouped Transitions (merged labels) */}
        {groupedTransitions.map(group => {
          const from = states.find(s => s.id === group.from);
          const to = states.find(s => s.id === group.to);
          if (!from || !to) return null;
          return (
            <GroupedTransitionEdge
              key={`${group.from}->${group.to}`}
              group={group}
              from={from}
              to={to}
              allGrouped={groupedTransitions}
              highlightedIds={highlightedTransitionIds}
              onClick={handleTransitionClick}
            />
          );
        })}

        {/* Connection preview line */}
        {connectingFromState && (
          <ConnectionLine from={connectingFromState} to={mousePos} />
        )}

        {/* Start arrows */}
        {states.filter(s => s.isStart).map(s => (
          <StartArrow key={`start-${s.id}`} state={s} />
        ))}

        {/* States */}
        {states.map(s => (
          <StateCircle
            key={s.id}
            state={s}
            isSelected={selectedStateId === s.id}
            isCurrentTestState={currentTestStateId === s.id}
            isAccepted={isAccepted}
            onDragStart={handleDragStart}
            onClick={handleStateClick}
            onDoubleClick={handleDoubleClick}
          />
        ))}
      </svg>

      {/* Mode indicator */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border text-xs font-mono text-muted-foreground">
          {mode === 'select' && 'Click to select • Drag to move • Double-click to toggle final'}
          {mode === 'add-state' && 'Click on canvas to add a state'}
          {mode === 'connect' && (connectingFrom ? 'Click target state to connect' : 'Click source state to start connection')}
          {mode === 'delete' && 'Click a state or transition to delete'}
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute bottom-3 left-3 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border text-xs font-mono text-muted-foreground">
          {states.length} state{states.length !== 1 ? 's' : ''} &middot;{' '}
          {transitions.length} transition{transitions.length !== 1 ? 's' : ''} &middot;{' '}
          Σ = {'{' + alphabet.join(', ') + '}'}
        </div>
      </div>
    </div>
  );
}
