'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useDFAStore } from '@/lib/dfa/store';
import { DFA, DFAState, DFATransition } from '@/lib/dfa/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  GitCompareArrows, ChevronLeft, ChevronRight, SkipForward, SkipBack,
  CheckCircle2, X as XIcon, Layers, ArrowRight, Eye, EyeOff,
  Info, Cpu, ArrowRightLeft, AlertCircle, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────────────────────────
// Mini SVG canvas — renders a small DFA diagram (read-only)
// ──────────────────────────────────────────────────────────────────
const R = 26;

function getMiniPath(
  from: DFAState, to: DFAState,
  all: DFATransition[]
): { path: string; lx: number; ly: number } {
  if (from.id === to.id) {
    return {
      path: `M ${from.x - R * 0.5} ${from.y - R * 0.85} C ${from.x - R * 1.3} ${from.y - R * 2.5} ${from.x + R * 1.3} ${from.y - R * 2.5} ${from.x + R * 0.5} ${from.y - R * 0.85}`,
      lx: from.x, ly: from.y - R * 2.1,
    };
  }
  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / dist, ny = dy / dist;
  const hasRev = all.some(t => t.from === to.id && t.to === from.id);
  const offset = hasRev ? -18 : 0;
  const px = -ny * offset, py = nx * offset;
  const sx = from.x + nx * R + px, sy = from.y + ny * R + py;
  const ex = to.x - nx * R + px, ey = to.y - ny * R + py;
  if (offset !== 0) {
    const mx = (sx + ex) / 2 + (-ny) * 20, my = (sy + ey) / 2 + nx * 20;
    return { path: `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`, lx: mx, ly: my };
  }
  return {
    path: `M ${sx} ${sy} L ${ex} ${ey}`,
    lx: (sx + ex) / 2 - ny * 14, ly: (sy + ey) / 2 + nx * 14,
  };
}

// Group same-direction transitions for mini canvas
function groupMiniTransitions(transitions: DFATransition[]): { from: string; to: string; symbols: string[]; id: string }[] {
  const map = new Map<string, { from: string; to: string; symbols: string[]; id: string }>();
  for (const t of transitions) {
    const key = `${t.from}->${t.to}`;
    if (!map.has(key)) map.set(key, { from: t.from, to: t.to, symbols: [], id: t.id });
    map.get(key)!.symbols.push(t.symbol);
  }
  return Array.from(map.values());
}

function MiniDFACanvas({ dfa, title, accent }: { dfa: DFA; title: string; accent: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [vb, setVb] = useState('0 0 500 300');

  useEffect(() => {
    if (dfa.states.length === 0) return;
    const xs = dfa.states.map(s => s.x);
    const ys = dfa.states.map(s => s.y);
    const pad = 70;
    const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
    setVb(`${minX} ${minY} ${Math.max(maxX - minX, 300)} ${Math.max(maxY - minY, 200)}`);
  }, [dfa]);

  if (dfa.states.length === 0) {
    return (
      <div className={`rounded-xl border ${accent === 'violet' ? 'border-violet-500/20 bg-violet-500/5' : 'border-emerald-500/20 bg-emerald-500/5'} p-4 text-center text-xs text-muted-foreground`}>
        <p className="font-medium mb-1">{title}</p>
        <p className="opacity-60">No states</p>
      </div>
    );
  }

  const grouped = groupMiniTransitions(dfa.transitions);

  return (
    <div className={`rounded-xl border overflow-hidden ${accent === 'violet' ? 'border-violet-500/20 bg-violet-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
      <div className={`px-3 py-1.5 border-b ${accent === 'violet' ? 'border-violet-500/20' : 'border-emerald-500/20'} text-[10px] font-semibold uppercase tracking-wider ${accent === 'violet' ? 'text-violet-400' : 'text-emerald-400'} flex items-center justify-between`}>
        <span>{title}</span>
        <span className="text-muted-foreground font-normal normal-case">{dfa.states.length} states · {dfa.transitions.length} transitions</span>
      </div>
      <svg ref={svgRef} viewBox={vb} className="w-full" style={{ height: 170 }}>
        <defs>
          <marker id={`mini-arr-${accent}`} markerWidth="8" markerHeight="8"
            refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 8 4 L 0 8 Z"
              fill={accent === 'violet' ? '#a78bfa' : '#34d399'} opacity={0.8} />
          </marker>
        </defs>

        {/* Grouped Transitions */}
        {grouped.map(g => {
          const from = dfa.states.find(s => s.id === g.from);
          const to = dfa.states.find(s => s.id === g.to);
          if (!from || !to) return null;
          const { path, lx, ly } = getMiniPath(from, to, dfa.transitions);
          const label = g.symbols.join(',');
          const labelW = Math.max(label.length * 6 + 8, 18);
          return (
            <g key={g.id}>
              <path d={path} fill="none"
                stroke={accent === 'violet' ? '#a78bfa' : '#34d399'}
                strokeWidth={1.5} opacity={0.5}
                markerEnd={`url(#mini-arr-${accent})`} />
              <rect x={lx - labelW / 2} y={ly - 8} width={labelW} height={16} rx={4}
                fill="var(--background)" opacity={0.9} />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
                fontSize={9} fontFamily="monospace" fontWeight="bold"
                fill={accent === 'violet' ? '#a78bfa' : '#34d399'}>
                {label}
              </text>
            </g>
          );
        })}

        {/* Start arrows */}
        {dfa.states.filter(s => s.isStart).map(s => (
          <path key={`sa-${s.id}`}
            d={`M ${s.x - R - 35} ${s.y} L ${s.x - R} ${s.y}`}
            stroke={accent === 'violet' ? '#a78bfa' : '#34d399'}
            strokeWidth={1.5} markerEnd={`url(#mini-arr-${accent})`} opacity={0.6} />
        ))}

        {/* States */}
        {dfa.states.map(s => (
          <g key={s.id}>
            <circle cx={s.x} cy={s.y} r={R}
              fill={accent === 'violet' ? 'rgba(139,92,246,0.15)' : 'rgba(52,211,153,0.15)'}
              stroke={accent === 'violet' ? '#a78bfa' : '#34d399'}
              strokeWidth={2} opacity={0.9} />
            {s.isFinal && (
              <circle cx={s.x} cy={s.y} r={R - 5}
                fill="none"
                stroke={accent === 'violet' ? '#a78bfa' : '#34d399'}
                strokeWidth={1.5} opacity={0.6} />
            )}
            <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
              fontSize={s.label.length > 4 ? 8 : 11}
              fontFamily="monospace" fontWeight="bold"
              fill={accent === 'violet' ? '#c4b5fd' : '#6ee7b7'}>
              {s.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Minimization Table
// ──────────────────────────────────────────────────────────────────
function MinimizationTable({
  table, tableLabels, markedThisStep,
}: {
  table: boolean[][];
  tableLabels: string[];
  markedThisStep: [number, number][];
}) {
  const n = tableLabels.length;
  if (n < 2) return null;
  const newSet = new Set(markedThisStep.map(([i, j]) => `${Math.min(i, j)}-${Math.max(i, j)}`));

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse mx-auto">
        <thead>
          <tr>
            <th className="w-8 h-7" />
            {tableLabels.slice(0, n - 1).map(l => (
              <th key={l} className="w-9 h-7 text-center">
                <span className="text-[9px] font-mono text-muted-foreground">{l}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableLabels.slice(1).map((rowLabel, rowIdx) => {
            const ar = rowIdx + 1;
            return (
              <tr key={rowLabel}>
                <td className="h-9 text-center pr-1">
                  <span className="text-[9px] font-mono text-muted-foreground">{rowLabel}</span>
                </td>
                {Array.from({ length: ar }, (_, ci) => {
                  const key = `${ci}-${ar}`;
                  const marked = table[ci]?.[ar] ?? false;
                  const isNew = newSet.has(key);
                  return (
                    <td key={ci} className="w-9 h-9 p-0.5">
                      <div className={cn(
                        'w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all duration-500',
                        isNew && marked
                          ? 'bg-red-500/30 border-2 border-red-400 scale-110 shadow-lg shadow-red-500/30'
                          : marked
                          ? 'bg-red-500/10 border border-red-500/30'
                          : 'bg-emerald-500/10 border border-emerald-500/20'
                      )}>
                        {marked
                          ? <XIcon className={cn('w-3.5 h-3.5', isNew ? 'text-red-400' : 'text-red-400/50')} />
                          : <CheckCircle2 className="w-3 h-3 text-emerald-400/50" />}
                      </div>
                    </td>
                  );
                })}
                {Array.from({ length: n - 1 - ar }, (_, i) => (
                  <td key={`e${i}`} className="w-9 h-9" />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-4 mt-2 px-1 justify-center">
        <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-2 h-2 text-emerald-400/60" />
          </div>Equivalent
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <div className="w-3.5 h-3.5 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <XIcon className="w-2 h-2 text-red-400/60" />
          </div>Distinguishable
        </span>
        {markedThisStep.length > 0 && (
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <div className="w-3.5 h-3.5 rounded bg-red-500/30 border-2 border-red-400" />
            New this step
          </span>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// MAIN PANEL
// ──────────────────────────────────────────────────────────────────
export default function MinimizationPanel() {
  const {
    states, transitions, alphabet,
    minimizationResult, currentStep, setStep,
    minimize, resetMinimization,
    showMinimized, setShowMinimized,
    validationErrors,
  } = useDFAStore();

  const steps = minimizationResult?.steps ?? [];
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const [activeView, setActiveView] = useState<'steps' | 'compare'>('steps');

  const originalDFA: DFA = { states, transitions, alphabet };

  const hasBlockingErrors = validationErrors.some(e => e.severity === 'error');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <GitCompareArrows className="w-4 h-4 text-amber-400" />
          Minimization
          {minimizationResult && (
            <span className="ml-auto flex gap-1">
              <button
                className={cn('text-[10px] px-2 py-0.5 rounded-md transition-colors',
                  activeView === 'steps' ? 'bg-amber-500/20 text-amber-300' : 'text-muted-foreground hover:text-foreground')}
                onClick={() => setActiveView('steps')}
              >Steps</button>
              <button
                className={cn('text-[10px] px-2 py-0.5 rounded-md transition-colors',
                  activeView === 'compare' ? 'bg-emerald-500/20 text-emerald-300' : 'text-muted-foreground hover:text-foreground')}
                onClick={() => setActiveView('compare')}
              >Compare DFAs</button>
            </span>
          )}
        </h3>
      </div>

      {/* Validation errors display */}
      {hasBlockingErrors && minimizationResult && (
        <div className="px-4 py-2 border-b border-destructive/20">
          <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-destructive">Cannot minimize — fix these errors first:</p>
                {validationErrors.filter(e => e.severity === 'error').map((err, i) => (
                  <p key={i} className="text-xs text-destructive/80">• {err.message}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!minimizationResult ? (
        /* ── No result yet ── */
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <div className="text-center text-muted-foreground">
            <GitCompareArrows className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">Minimize Your DFA</p>
            <p className="text-xs opacity-70 max-w-[220px] leading-relaxed">
              Uses the Myhill–Nerode table-filling algorithm with dead state injection and step-by-step visual explanation
            </p>
          </div>
          <Button
            onClick={minimize}
            disabled={states.length < 2}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <GitCompareArrows className="w-4 h-4" />
            Run Minimization
          </Button>
          {states.length < 2 && (
            <p className="text-[10px] text-muted-foreground opacity-60">Need at least 2 states</p>
          )}
        </div>
      ) : activeView === 'compare' ? (
        /* ── Compare view ── */
        <ScrollArea className="flex-1">
          <div className="px-3 py-3 space-y-3">
            <MiniDFACanvas dfa={originalDFA} title="Original DFA" accent="violet" />
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                {states.length - minimizationResult.minimizedDFA.states.length > 0
                  ? `Reduced by ${states.length - minimizationResult.minimizedDFA.states.length} state(s)`
                  : 'Already minimal'}
              </div>
            </div>
            <MiniDFACanvas dfa={minimizationResult.minimizedDFA} title="Minimized DFA" accent="emerald" />

            {/* Info badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              {minimizationResult.removedUnreachable.length > 0 && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-amber-500/30 text-amber-400 gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {minimizationResult.removedUnreachable.length} unreachable removed
                </Badge>
              )}
              {minimizationResult.deadStateAdded && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-blue-500/30 text-blue-400 gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Trap state added
                </Badge>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => setShowMinimized(!showMinimized)}
              className={cn(
                'w-full gap-2 text-xs mt-2',
                showMinimized
                  ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
              )}
              variant="outline"
            >
              {showMinimized
                ? <><EyeOff className="w-3.5 h-3.5" />Show Original on Canvas</>
                : <><Eye className="w-3.5 h-3.5" />View Minimized DFA on Canvas</>}
            </Button>
          </div>
        </ScrollArea>
      ) : (
        /* ── Steps view ── */
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Step navigator */}
          <div className="px-4 py-2 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setStep(0)} disabled={currentStep === 0}>
                  <SkipBack className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setStep(currentStep - 1)} disabled={currentStep === 0}>
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setStep(currentStep + 1)} disabled={isLast}>
                  <ChevronRight className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setStep(steps.length - 1)} disabled={isLast}>
                  <SkipForward className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Step progress dots */}
            <div className="flex gap-1.5 flex-wrap">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === currentStep
                      ? 'bg-amber-400 w-6'
                      : i < currentStep
                      ? 'bg-amber-400/40 w-3'
                      : 'bg-border w-3 hover:bg-muted-foreground/40'
                  )}
                  title={`Step ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 py-3 space-y-4">

              {/* Step label badge */}
              <div className={cn(
                'flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs leading-relaxed',
                currentStep === 0
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                  : isLast
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
              )}>
                {currentStep === 0 ? <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                  : isLast ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                  : <Cpu className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />}
                <span>{step?.description}</span>
              </div>

              {/* Reasoning bullets */}
              {step?.reasoning && step.reasoning.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1">
                    Reasoning
                  </p>
                  {step.reasoning.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground px-1">
                      <span className="text-amber-500/60 shrink-0 mt-0.5">›</span>
                      <span className="leading-relaxed">{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Table */}
              {step?.table && step.table.length > 0 && step.tableLabels.length > 1 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1 mb-2">
                    Distinguishability Table
                  </p>
                  <MinimizationTable
                    table={step.table}
                    tableLabels={step.tableLabels}
                    markedThisStep={step.markedThisStep}
                  />
                </div>
              )}

              {/* Final: show equivalence classes + mini canvas */}
              {isLast && minimizationResult.equivalenceClasses && (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      Equivalence Classes → New States
                    </p>
                    <div className="space-y-1.5">
                      {minimizationResult.equivalenceClasses.map((ec, i) => {
                        const newState = minimizationResult.minimizedDFA.states[i];
                        return (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs">
                            <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-mono bg-violet-500/20 text-violet-300 border-violet-500/30 shrink-0">
                              {ec.join(',')}
                            </Badge>
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="font-mono font-semibold text-foreground">{newState?.label ?? `C${i + 1}`}</span>
                            <div className="ml-auto flex gap-1">
                              {newState?.isStart && <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-500/30 text-blue-400">start</Badge>}
                              {newState?.isFinal && <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/30 text-emerald-400">final</Badge>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Info badges */}
                  {(minimizationResult.removedUnreachable.length > 0 || minimizationResult.deadStateAdded) && (
                    <div className="flex flex-wrap gap-2">
                      {minimizationResult.removedUnreachable.length > 0 && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-amber-500/30 text-amber-400 gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {minimizationResult.removedUnreachable.length} unreachable state(s) removed
                        </Badge>
                      )}
                      {minimizationResult.deadStateAdded && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-blue-500/30 text-blue-400 gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Trap state injected for missing transitions
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Mini minimized DFA preview */}
                  <MiniDFACanvas dfa={minimizationResult.minimizedDFA} title="Minimized DFA" accent="emerald" />

                  {/* Toggle canvas view */}
                  <Button
                    size="sm"
                    onClick={() => setShowMinimized(!showMinimized)}
                    className={cn(
                      'w-full gap-2 text-xs',
                      showMinimized
                        ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                    )}
                    variant="outline"
                  >
                    {showMinimized
                      ? <><EyeOff className="w-3.5 h-3.5" />Show Original on Main Canvas</>
                      : <><Eye className="w-3.5 h-3.5" />View Minimized on Main Canvas</>}
                  </Button>
                </>
              )}

              {/* Reset */}
              <div className="pt-1">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { resetMinimization(); setShowMinimized(false); }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset & Run Again
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
