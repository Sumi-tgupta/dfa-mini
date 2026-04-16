'use client';

import React, { useMemo } from 'react';
import { useDFAStore } from '@/lib/dfa/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowRight, Minimize2 } from 'lucide-react';

// ─── Transition Table ───
export default function TransitionTableView() {
  const states = useDFAStore(s => s.states);
  const transitions = useDFAStore(s => s.transitions);
  const alphabet = useDFAStore(s => s.alphabet);
  const minimizationResult = useDFAStore(s => s.minimizationResult);

  // Build lookup: from_id + symbol → to_id
  const transMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of transitions) map.set(`${t.from}|${t.symbol}`, t.to);
    return map;
  }, [transitions]);

  const minTransMap = useMemo(() => {
    if (!minimizationResult) return null;
    const map = new Map<string, string>();
    for (const t of minimizationResult.minimizedDFA.transitions) {
      map.set(`${t.from}|${t.symbol}`, t.to);
    }
    return map;
  }, [minimizationResult]);

  if (states.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-sky-400 opacity-50" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">No DFA yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add states to see the transition table</p>
        </div>
      </div>
    );
  }

  const minStates = minimizationResult?.minimizedDFA.states ?? [];
  const minAlphabet = minimizationResult?.minimizedDFA.alphabet ?? alphabet;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="px-4 py-3 space-y-5">

          {/* ── Original DFA Table ── */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
              Original DFA — δ Table
              <span className="ml-auto text-[9px] font-normal normal-case">{states.length} state{states.length !== 1 ? 's' : ''}</span>
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-xs min-w-[200px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-[11px] w-12">State</th>
                    {alphabet.map(sym => (
                      <th key={sym} className="px-3 py-2 text-center font-mono font-semibold text-violet-400 text-[11px]">{sym}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {states.map((state, i) => (
                    <tr key={state.id} className={cn(
                      'border-b border-border/50 last:border-0 transition-colors',
                      i % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'
                    )}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-foreground text-[11px]">{state.label}</span>
                          {state.isStart && <span className="text-[8px] text-blue-400 font-semibold">→</span>}
                          {state.isFinal && (
                            <span className="w-3 h-3 rounded-full border border-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      {alphabet.map(sym => {
                        const targetId = transMap.get(`${state.id}|${sym}`);
                        const targetState = states.find(s => s.id === targetId);
                        return (
                          <td key={sym} className="px-3 py-2 text-center">
                            {targetState
                              ? <span className="font-mono text-[11px] text-foreground">{targetState.label}</span>
                              : <span className="text-[10px] text-muted-foreground/40">—</span>
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Minimized DFA Table ── */}
          {minimizationResult && minStates.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Minimized DFA — δ Table
                <Badge variant="outline" className="ml-1 text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 gap-1">
                  <Minimize2 className="w-2.5 h-2.5" />
                  {minStates.length} states
                </Badge>
              </p>
              <div className="overflow-x-auto rounded-xl border border-emerald-500/20">
                <table className="w-full border-collapse text-xs min-w-[200px]">
                  <thead>
                    <tr className="border-b border-emerald-500/20 bg-emerald-500/5">
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-[11px] w-12">State</th>
                      {minAlphabet.map(sym => (
                        <th key={sym} className="px-3 py-2 text-center font-mono font-semibold text-emerald-400 text-[11px]">{sym}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {minStates.map((state, i) => (
                      <tr key={state.id} className={cn(
                        'border-b border-emerald-500/10 last:border-0 transition-colors',
                        i % 2 === 0 ? 'bg-transparent' : 'bg-emerald-500/5'
                      )}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-foreground text-[11px]">{state.label}</span>
                            {state.isStart && <span className="text-[8px] text-blue-400 font-semibold">→</span>}
                            {state.isFinal && (
                              <span className="w-3 h-3 rounded-full border border-emerald-400 flex-shrink-0" />
                            )}
                          </div>
                        </td>
                        {minAlphabet.map(sym => {
                          const targetId = minTransMap?.get(`${state.id}|${sym}`);
                          const targetState = minStates.find(s => s.id === targetId);
                          return (
                            <td key={sym} className="px-3 py-2 text-center">
                              {targetState
                                ? <span className="font-mono text-[11px] text-emerald-300">{targetState.label}</span>
                                : <span className="text-[10px] text-muted-foreground/40">—</span>
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Reduction summary */}
              <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                <span className="font-mono text-violet-300">{states.length} states</span>
                <ArrowRight className="w-3 h-3" />
                <span className="font-mono text-emerald-300">{minStates.length} states</span>
                {states.length > minStates.length && (
                  <Badge variant="outline" className="ml-auto text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400">
                    −{states.length - minStates.length} states ({Math.round((1 - minStates.length / states.length) * 100)}% reduced)
                  </Badge>
                )}
                {states.length === minStates.length && (
                  <Badge variant="outline" className="ml-auto text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-400">
                    Already minimal
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
