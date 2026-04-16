'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDFAStore } from '@/lib/dfa/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GitCompareArrows, ChevronLeft, ChevronRight, SkipForward, SkipBack,
  CheckCircle2, X as XIcon, Layers, ArrowRight,
  Info, Cpu, AlertCircle, AlertTriangle, ShieldCheck, RotateCcw,
  Minimize2, Play, Pause, Download, TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const MinimizedDFACanvas = dynamic(() => import('@/components/dfa/MinimizedDFACanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Loading canvas…
    </div>
  ),
});

// ──────────────────────────────────────────────────────────
// Minimization Table with per-cell animation
// ──────────────────────────────────────────────────────────
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
                      <motion.div
                        animate={isNew && marked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className={cn(
                          'w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all duration-500',
                          isNew && marked
                            ? 'bg-red-500/30 border-2 border-red-400 shadow-lg shadow-red-500/30'
                            : marked
                            ? 'bg-red-500/10 border border-red-500/30'
                            : 'bg-emerald-500/10 border border-emerald-500/20'
                        )}>
                        {marked
                          ? <XIcon className={cn('w-3.5 h-3.5', isNew ? 'text-red-400' : 'text-red-400/50')} />
                          : <CheckCircle2 className="w-3 h-3 text-emerald-400/50" />}
                      </motion.div>
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

// ──────────────────────────────────────────────────────────
// Animated stat counter
// ──────────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const end = value;
    if (start === end) return;
    const diff = end - start;
    const steps = 20;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplay(Math.round(start + (diff * i) / steps));
      if (i >= steps) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

// ──────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────
export default function MinimizationSection() {
  const {
    states, alphabet,
    minimizationResult, currentStep, setStep,
    minimize, resetMinimization,
    validationErrors,
  } = useDFAStore();

  const stateCount = useDFAStore(s => s.states.length);
  const steps = minimizationResult?.steps ?? [];
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const hasBlockingErrors = validationErrors.some(e => e.severity === 'error');
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-play state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1500); // ms per step
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPlay = useCallback(() => {
    if (playRef.current) clearInterval(playRef.current);
    playRef.current = null;
    setIsPlaying(false);
  }, []);

  const startPlay = useCallback(() => {
    const s = useDFAStore.getState();
    if (s.currentStep >= steps.length - 1) { setStep(0); }
    setIsPlaying(true);
    playRef.current = setInterval(() => {
      const cur = useDFAStore.getState().currentStep;
      if (cur >= steps.length - 1) {
        stopPlay();
      } else {
        setStep(cur + 1);
      }
    }, playSpeed);
  }, [isLast, steps.length, playSpeed, setStep, stopPlay]);

  const togglePlay = () => isPlaying ? stopPlay() : startPlay();

  // Stop play when reaching the end
  useEffect(() => { if (isLast) stopPlay(); }, [isLast, stopPlay]);
  useEffect(() => () => stopPlay(), [stopPlay]);

  // Export minimized DFA as PNG
  const handleExportPNG = () => {
    const svgEl = canvasRef.current?.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const scale = 2;
    const w = svgEl.clientWidth || 700;
    const h = svgEl.clientHeight || 400;
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = 'minimized-dfa.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  };

  const handleMinimize = () => {
    minimize();
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // ── No result: show button ──
  if (!minimizationResult) {
    return (
      <div ref={sectionRef} className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 pb-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 mx-auto">
              <Minimize2 className="w-8 h-8 text-amber-400 opacity-70" />
            </div>
            <Button
              onClick={handleMinimize}
              disabled={stateCount < 2}
              size="lg"
              className="gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-xl shadow-amber-500/20 px-8 py-6 text-base rounded-xl transition-all hover:scale-105 active:scale-100"
            >
              <Minimize2 className="w-5 h-5" />
              Minimize DFA
            </Button>
            {stateCount < 2 && (
              <p className="text-xs text-muted-foreground">Need at least 2 states to minimize</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const minStates = minimizationResult.minimizedDFA.states.length;
  const minTrans = minimizationResult.minimizedDFA.transitions.length;
  const origTrans = states.length * alphabet.length;
  const savedStates = states.length - minStates;
  const reduction = states.length > 0 ? Math.round((savedStates / states.length) * 100) : 0;

  // ── Has result ──
  return (
    <AnimatePresence>
      <motion.div
        ref={sectionRef}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 pb-8"
      >
        {/* ── Stats dashboard ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5 rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
        >
          <div className="px-5 py-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <GitCompareArrows className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-tight">Minimization Result</p>
                <p className="text-[10px] text-muted-foreground">Myhill–Nerode table-filling</p>
              </div>
            </div>

            <div className="h-8 w-px bg-border hidden sm:block" />

            {/* Stat pills */}
            {[
              { label: 'States', from: states.length, to: minStates, color: 'violet' },
              { label: 'Transitions', from: origTrans, to: minTrans, color: 'sky' },
            ].map(({ label, from, to, color }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className={`font-mono font-bold text-sm text-${color}-400`}><AnimatedNumber value={from} /></span>
                <span className="text-muted-foreground/50">→</span>
                <span className={`font-mono font-bold text-sm text-emerald-400`}><AnimatedNumber value={to} /></span>
                <span className="text-muted-foreground text-[10px]">{label}</span>
              </div>
            ))}

            {savedStates > 0 && (
              <>
                <div className="h-8 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400"><AnimatedNumber value={reduction} />% reduction</span>
                </div>
              </>
            )}
            {savedStates === 0 && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Already minimal
              </Badge>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {minimizationResult.removedUnreachable.length > 0 && (
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {minimizationResult.removedUnreachable.length} unreachable removed
                </Badge>
              )}
              {minimizationResult.deadStateAdded && (
                <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Trap state injected
                </Badge>
              )}
              <Button
                variant="ghost" size="sm"
                onClick={() => { resetMinimization(); stopPlay(); }}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Validation errors */}
        {hasBlockingErrors && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive">
                {validationErrors.filter(e => e.severity === 'error').map(e => e.message).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Canvas + Steps */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* LEFT: Minimized DFA Canvas */}
          <div ref={canvasRef} className="flex-1 min-h-[360px] lg:min-h-[420px] relative rounded-xl border border-emerald-500/20 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center gap-2">
                <Minimize2 className="w-3.5 h-3.5" />
                Minimized DFA
              </div>
            </div>

            {/* Export PNG button */}
            <div className="absolute top-3 right-3 z-10">
              <Button
                variant="ghost" size="sm"
                onClick={handleExportPNG}
                className="h-8 gap-1.5 text-[10px] bg-background/60 backdrop-blur-sm border border-border hover:bg-background/80"
              >
                <Download className="w-3.5 h-3.5" />
                Export PNG
              </Button>
            </div>

            <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
              <div className="px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border text-xs font-mono text-muted-foreground">
                <AnimatedNumber value={minStates} /> states · <AnimatedNumber value={minTrans} /> transitions · Σ = {'{' + alphabet.join(', ') + '}'}
              </div>
            </div>
            <MinimizedDFACanvas dfa={minimizationResult.minimizedDFA} />
          </div>

          {/* RIGHT: Steps panel */}
          <div className="w-full lg:w-[420px] flex-shrink-0 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col max-h-[540px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between">
              <h3 className="text-xs font-semibold flex items-center gap-2 text-amber-400">
                <Cpu className="w-3.5 h-3.5" />
                Algorithm Steps
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono">{currentStep + 1}/{steps.length}</span>
            </div>

            {/* Navigator */}
            <div className="px-4 py-2.5 border-b border-border shrink-0 space-y-2">
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { stopPlay(); setStep(0); }} disabled={currentStep === 0}>
                  <SkipBack className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { stopPlay(); setStep(currentStep - 1); }} disabled={currentStep === 0}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>

                {/* Auto-play toggle */}
                <button
                  onClick={togglePlay}
                  className={cn(
                    'h-7 px-3 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-all',
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-border/50 text-muted-foreground hover:text-foreground hover:bg-border'
                  )}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isPlaying ? 'Pause' : 'Auto-play'}
                </button>

                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { stopPlay(); setStep(currentStep + 1); }} disabled={isLast}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { stopPlay(); setStep(steps.length - 1); }} disabled={isLast}>
                  <SkipForward className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Speed control (only shown when playing or hovered) */}
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-[10px] text-muted-foreground"
                >
                  <span>Slow</span>
                  <input
                    type="range" min={500} max={3000} step={250}
                    value={4000 - playSpeed} // invert for UX
                    onChange={e => setPlaySpeed(4000 - Number(e.target.value))}
                    className="flex-1 accent-amber-400 h-1"
                  />
                  <span>Fast</span>
                </motion.div>
              )}

              {/* Progress dots */}
              <div className="flex gap-1.5 flex-wrap">
                {steps.map((_, i) => (
                  <button key={i} onClick={() => { stopPlay(); setStep(i); }}
                    className={cn('h-1.5 rounded-full transition-all duration-300',
                      i === currentStep ? 'bg-amber-400 w-6'
                        : i < currentStep ? 'bg-amber-400/40 w-3'
                        : 'bg-border w-3 hover:bg-muted-foreground/40'
                    )} title={`Step ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Step content */}
            <ScrollArea className="flex-1">
              <div className="px-4 py-3 space-y-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {/* Step description */}
                    <div className={cn(
                      'flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs leading-relaxed',
                      currentStep === 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                        : isLast ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                    )}>
                      {currentStep === 0 ? <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                        : isLast ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                        : <Cpu className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />}
                      <span>{step?.description}</span>
                    </div>

                    {/* Reasoning */}
                    {step?.reasoning && step.reasoning.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1">Reasoning</p>
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

                    {/* Equivalence classes */}
                    {isLast && minimizationResult.equivalenceClasses && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1 mb-2 flex items-center gap-1.5">
                          <Layers className="w-3 h-3" />
                          Equivalence Classes → New States
                        </p>
                        <div className="space-y-1.5">
                          {minimizationResult.equivalenceClasses.map((ec, i) => {
                            const newState = minimizationResult.minimizedDFA.states[i];
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs"
                              >
                                <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-mono bg-violet-500/20 text-violet-300 border-violet-500/30 shrink-0">
                                  {ec.join(',')}
                                </Badge>
                                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="font-mono font-semibold text-foreground">{newState?.label ?? `C${i + 1}`}</span>
                                <div className="ml-auto flex gap-1">
                                  {newState?.isStart && <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-500/30 text-blue-400">start</Badge>}
                                  {newState?.isFinal && <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/30 text-emerald-400">final</Badge>}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
