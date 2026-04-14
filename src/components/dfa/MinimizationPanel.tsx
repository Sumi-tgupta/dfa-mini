'use client';

import React from 'react';
import { useDFAStore } from '@/lib/dfa/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  GitCompareArrows,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  SkipBack,
  CheckCircle2,
  X as XIcon,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MinimizationPanel() {
  const {
    states,
    alphabet,
    minimizationResult,
    currentStep,
    setStep,
    minimize,
    resetMinimization,
    showMinimized,
    setShowMinimized,
  } = useDFAStore();

  const steps = minimizationResult?.steps || [];
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <GitCompareArrows className="w-4 h-4 text-amber-400" />
          Minimization
        </h3>
      </div>

      {!minimizationResult ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <div className="text-center text-muted-foreground">
            <GitCompareArrows className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">Minimize Your DFA</p>
            <p className="text-xs opacity-70 max-w-[200px] leading-relaxed">
              Uses the table-filling (Myhill–Nerode) algorithm to find and merge equivalent states
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
            <p className="text-[10px] text-muted-foreground opacity-60">
              Need at least 2 states to minimize
            </p>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4 py-3">

          {/* Step navigation */}
          <div className="flex items-center justify-center gap-1 mb-3">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setStep(0)} disabled={currentStep === 0}>
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setStep(currentStep - 1)} disabled={currentStep === 0}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-mono text-muted-foreground w-24 text-center">
              Step {currentStep + 1} / {steps.length}
            </span>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setStep(currentStep + 1)} disabled={currentStep >= steps.length - 1}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setStep(steps.length - 1)} disabled={isLastStep}>
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Step description */}
          {currentStepData && (
            <div className="mb-4 p-3 rounded-lg bg-card border border-border">
              <p className="text-xs text-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>
          )}

          {/* Table visualization */}
          {currentStepData && currentStepData.table.length > 0 && (
            <div className="mb-4 overflow-x-auto">
              <MinimizationTable step={currentStepData} />
            </div>
          )}

          {/* Equivalence classes — show on last step */}
          {minimizationResult.equivalenceClasses && isLastStep && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Equivalence Classes
              </p>
              <div className="space-y-1.5">
                {minimizationResult.equivalenceClasses.map((ec, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono bg-violet-500/20 text-violet-300 border-violet-500/30">
                      C{i + 1}
                    </Badge>
                    <span className="text-xs font-mono text-foreground">
                      {'{ '}{ec.join(', ')}{' }'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats + Toggle Minimized View — show on last step */}
          {isLastStep && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Minimization Complete</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                <div>
                  <span className="text-muted-foreground">Original:</span>{' '}
                  <span className="font-mono font-medium">{states.length} states</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Minimized:</span>{' '}
                  <span className="font-mono font-medium">{minimizationResult.minimizedDFA.states.length} states</span>
                </div>
              </div>

              {states.length > minimizationResult.minimizedDFA.states.length && (
                <p className="text-xs text-emerald-400 mb-3">
                  <ArrowRight className="w-3 h-3 inline mr-1" />
                  Reduced by {states.length - minimizationResult.minimizedDFA.states.length} state(s)
                  ({Math.round((1 - minimizationResult.minimizedDFA.states.length / states.length) * 100)}% smaller)
                </p>
              )}

              {states.length === minimizationResult.minimizedDFA.states.length && (
                <p className="text-xs text-muted-foreground mb-3 italic">
                  DFA is already minimal — no states were merged.
                </p>
              )}

              {/* Toggle minimized view on canvas */}
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
                {showMinimized ? (
                  <><EyeOff className="w-3.5 h-3.5" />Show Original DFA</>
                ) : (
                  <><Eye className="w-3.5 h-3.5" />View Minimized DFA on Canvas</>
                )}
              </Button>
            </div>
          )}

          {/* Reset */}
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { resetMinimization(); setShowMinimized(false); }}
              className="w-full gap-2 text-xs"
            >
              Run Again
            </Button>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Minimization Table
// ──────────────────────────────────────────
function MinimizationTable({
  step,
}: {
  step: { table: boolean[][]; tableLabels: string[]; markedThisStep: [number, number][] };
}) {
  const { table, tableLabels, markedThisStep } = step;
  const n = tableLabels.length;
  if (n < 2) return null;

  const newlyMarkedSet = new Set(markedThisStep.map(([i, j]) => `${Math.min(i, j)}-${Math.max(i, j)}`));

  return (
    <div className="inline-block">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="w-8 h-8" />
            {tableLabels.slice(0, n - 1).map(label => (
              <th key={label} className="w-10 h-8 text-center">
                <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableLabels.slice(1).map((rowLabel, rowIdx) => {
            const actualRow = rowIdx + 1;
            return (
              <tr key={rowLabel}>
                <td className="h-8 text-center">
                  <span className="text-[10px] font-mono text-muted-foreground">{rowLabel}</span>
                </td>
                {Array.from({ length: actualRow }, (_, colIdx) => {
                  const key = `${colIdx}-${actualRow}`;
                  const isMarked = table[colIdx][actualRow];
                  const isNew = newlyMarkedSet.has(key);
                  return (
                    <td key={colIdx} className="w-10 h-8 text-center p-0.5">
                      <div className={cn(
                        'w-8 h-8 mx-auto rounded-md flex items-center justify-center text-xs transition-all duration-500',
                        isNew && isMarked
                          ? 'bg-red-500/20 border-2 border-red-400 scale-110'
                          : isMarked
                          ? 'bg-red-500/10 border border-red-500/30'
                          : 'bg-emerald-500/10 border border-emerald-500/20'
                      )}>
                        {isMarked
                          ? <XIcon className={cn('w-4 h-4', isNew ? 'text-red-400' : 'text-red-400/60')} />
                          : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60" />
                        }
                      </div>
                    </td>
                  );
                })}
                {Array.from({ length: n - 1 - actualRow }, (_, i) => (
                  <td key={`empty-${i}`} className="w-10 h-8" />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex items-center gap-4 mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400/60" />
          </div>
          <span className="text-[10px] text-muted-foreground">Equivalent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <XIcon className="w-2.5 h-2.5 text-red-400/60" />
          </div>
          <span className="text-[10px] text-muted-foreground">Distinguishable</span>
        </div>
        {markedThisStep.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-500/20 border-2 border-red-400" />
            <span className="text-[10px] text-muted-foreground">New this step</span>
          </div>
        )}
      </div>
    </div>
  );
}
