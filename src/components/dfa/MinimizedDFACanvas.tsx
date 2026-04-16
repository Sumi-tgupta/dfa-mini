'use client';

import React, { useRef, useState, useEffect } from 'react';
import { DFA, DFAState, DFATransition } from '@/lib/dfa/types';

const STATE_RADIUS = 28;
const ARROW_SIZE = 9;

// ──────────────────────────────────────────
// Grouped transitions
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
    if (!map.has(key)) map.set(key, { from: t.from, to: t.to, symbols: [], ids: [] });
    const g = map.get(key)!;
    g.symbols.push(t.symbol);
    g.ids.push(t.id);
  }
  return Array.from(map.values());
}

// ──────────────────────────────────────────
// Path calculations
// ──────────────────────────────────────────
function getPath(
  from: DFAState, to: DFAState,
  allGrouped: GroupedTransition[],
): { path: string; labelX: number; labelY: number } {
  const R = STATE_RADIUS;

  if (from.id === to.id) {
    return {
      path: `M ${from.x - R * 0.5} ${from.y - R * 0.85} C ${from.x - R * 1.5} ${from.y - R * 2.8} ${from.x + R * 1.5} ${from.y - R * 2.8} ${from.x + R * 0.5} ${from.y - R * 0.85}`,
      labelX: from.x,
      labelY: from.y - R * 2.3,
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
  const offset = hasReverse ? -18 : 0;

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
    };
  }

  return {
    path: `M ${startX} ${startY} L ${endX} ${endY}`,
    labelX: (startX + endX) / 2 + perpX * 16,
    labelY: (startY + endY) / 2 + perpY * 16,
  };
}

// ──────────────────────────────────────────
// Grid
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
// MINIMIZED DFA CANVAS (read-only)
// ──────────────────────────────────────────
export default function MinimizedDFACanvas({ dfa }: { dfa: DFA }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 400 });
  const R = STATE_RADIUS;

  const grouped = groupTransitions(dfa.transitions);

  useEffect(() => {
    const updateSize = () => {
      const el = svgRef.current?.parentElement;
      if (el) setDimensions({ width: el.clientWidth, height: el.clientHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (dfa.states.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
        No minimized DFA to display
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
    >
      <defs>
        <marker id="min-arrowhead" markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE}
          refX={ARROW_SIZE - 1} refY={ARROW_SIZE / 2} orient="auto" markerUnits="strokeWidth">
          <path d={`M 0 0 L ${ARROW_SIZE} ${ARROW_SIZE / 2} L 0 ${ARROW_SIZE} Z`}
            fill="#34d399" opacity={0.9} />
        </marker>
        <filter id="min-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <GridBackground width={dimensions.width} height={dimensions.height} />

      {/* Transitions */}
      {grouped.map(group => {
        const from = dfa.states.find(s => s.id === group.from);
        const to = dfa.states.find(s => s.id === group.to);
        if (!from || !to) return null;
        const { path, labelX, labelY } = getPath(from, to, grouped);
        const label = group.symbols.join(',');
        const labelWidth = Math.max(label.length * 8 + 12, 24);
        return (
          <g key={`${group.from}->${group.to}`}>
            <path d={path} className="stroke-emerald-400/60" strokeWidth={2} fill="none"
              markerEnd="url(#min-arrowhead)" />
            <path d={path} fill="none" stroke="transparent" strokeWidth={16} />
            <g transform={`translate(${labelX}, ${labelY})`}>
              <rect x={-labelWidth / 2} y={-10} width={labelWidth} height={20} rx={6}
                className="fill-background" opacity={0.9} />
              <text textAnchor="middle" dominantBaseline="central"
                className="fill-emerald-400 text-xs font-mono font-bold" fontSize={12}>
                {label}
              </text>
            </g>
          </g>
        );
      })}

      {/* Start arrows */}
      {dfa.states.filter(s => s.isStart).map(s => (
        <path key={`start-${s.id}`}
          d={`M ${s.x - R - 45} ${s.y} L ${s.x - R} ${s.y}`}
          stroke="#34d399" strokeWidth={2.5} markerEnd="url(#min-arrowhead)" opacity={0.7} />
      ))}

      {/* States */}
      {dfa.states.map(s => (
        <g key={s.id}>
          <circle cx={s.x} cy={s.y} r={R}
            fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" strokeWidth={2.5} opacity={0.9} />
          {s.isFinal && (
            <circle cx={s.x} cy={s.y} r={R - 6}
              fill="none" stroke="#34d399" strokeWidth={2} opacity={0.6} />
          )}
          <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
            className="fill-emerald-200 font-mono font-semibold"
            fontSize={s.label.length > 4 ? 10 : 13} pointerEvents="none">
            {s.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
