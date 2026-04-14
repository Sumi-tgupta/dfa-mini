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
// Compute transition path (self-loop / curved / straight)
// ──────────────────────────────────────────
function getTransitionPath(
  from: DFAState,
  to: DFAState,
  transitions: DFATransition[],
  transitionId: string
): { path: string; labelX: number; labelY: number; isSelfLoop: boolean } {
  const R = STATE_RADIUS;

  if (from.id === to.id) {
    return {
      path: `M ${from.x + R * 0.7} ${from.y - R * 0.7} C ${from.x + R * 2} ${from.y - R * 2.5} ${from.x + R * 2.5} ${from.y + R * 0.5} ${from.x + R * 0.7} ${from.y + R * 0.1}`,
      labelX: from.x + R * 2.2,
      labelY: from.y - R * 1.2,
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

  const hasReverse = transitions.some(t => t.from === to.id && t.to === from.id);
  const sameDirTransitions = transitions.filter(t => t.from === from.id && t.to === to.id);
  const isFirst = transitionId === sameDirTransitions[0]?.id;

  let offset = 0;
  if (hasReverse) {
    offset = isFirst ? -20 : 20;
  } else if (sameDirTransitions.length > 1) {
    const idx = sameDirTransitions.findIndex(t => t.id === transitionId);
    offset = (idx - (sameDirTransitions.length - 1) / 2) * 24;
  }

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
// Transition edge
// ──────────────────────────────────────────
function TransitionEdge({
  transition, from, to, allTransitions, isHighlighted, onClick,
}: {
  transition: DFATransition;
  from: DFAState;
  to: DFAState;
  allTransitions: DFATransition[];
  isHighlighted: boolean;
  onClick: (t: DFATransition) => void;
}) {
  const { path, labelX, labelY, isSelfLoop } = getTransitionPath(from, to, allTransitions, transition.id);

  const markerUrl = isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)';

  return (
    <g className="cursor-pointer" onClick={() => onClick(transition)}>
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
          x={-12} y={-10} width={24} height={20} rx={6}
          className="fill-background" opacity={0.9}
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          className={`fill-foreground text-xs font-mono font-bold ${isHighlighted ? 'fill-emerald-400' : ''}`}
          fontSize={13}
        >
          {transition.symbol}
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
        className={`fill-foreground font-mono text-sm font-semibold ${isCurrentTestState ? (isAccepted ? 'fill-emerald-300' : 'fill-red-300') : ''}`}
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
    setMode, updateStatePosition, setEditingTransition,
    testResult, currentTestStep,
    // BUG FIX: get testString directly from store — TestResult has no testString field
    testString,
    showMinimized, minimizationResult,
  } = useDFAStore();

  // Which DFA to display
  const displayStates = showMinimized && minimizationResult?.minimizedDFA
    ? minimizationResult.minimizedDFA.states : states;
  const displayTransitions = showMinimized && minimizationResult?.minimizedDFA
    ? minimizationResult.minimizedDFA.transitions : transitions;

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
  // BUG FIX: was `testResult?.testString` (doesn't exist) → now uses `testString` from store
  const testStep = testResult?.steps[currentTestStep];
  const currentTestStateId = testStep ? testStep.state : null;
  const isAccepted = testStep?.isAccepted ?? false;

  const prevStep = currentTestStep > 0 ? testResult?.steps[currentTestStep - 1] : null;
  const highlightedTransitionId = prevStep
    ? displayTransitions.find(
        t => t.from === prevStep.state && t.symbol === testString[currentTestStep - 1]
      )?.id ?? null
    : null;

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
        // BUG FIX: use addTransitionAndEdit to open symbol picker immediately
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

  const connectingFromState = displayStates.find(s => s.id === connectingFrom);

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

        {/* Transitions */}
        {displayTransitions.map(t => {
          const from = displayStates.find(s => s.id === t.from);
          const to = displayStates.find(s => s.id === t.to);
          if (!from || !to) return null;
          return (
            <TransitionEdge
              key={t.id}
              transition={t}
              from={from}
              to={to}
              allTransitions={displayTransitions}
              isHighlighted={highlightedTransitionId === t.id}
              onClick={handleTransitionClick}
            />
          );
        })}

        {/* Connection preview line */}
        {connectingFromState && (
          <ConnectionLine from={connectingFromState} to={mousePos} />
        )}

        {/* Start arrows */}
        {displayStates.filter(s => s.isStart).map(s => (
          <StartArrow key={`start-${s.id}`} state={s} />
        ))}

        {/* States */}
        {displayStates.map(s => (
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
          {displayStates.length} state{displayStates.length !== 1 ? 's' : ''} &middot;{' '}
          {displayTransitions.length} transition{displayTransitions.length !== 1 ? 's' : ''} &middot;{' '}
          Σ = {'{' + alphabet.join(', ') + '}'}
        </div>
      </div>
    </div>
  );
}
