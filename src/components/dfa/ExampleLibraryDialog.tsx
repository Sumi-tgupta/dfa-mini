'use client';

import React, { useState } from 'react';
import { useDFAStore } from '@/lib/dfa/store';
import { EXAMPLE_DFAS } from '@/features/dfa/examples/library';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { BookOpen, Layers, ChevronRight, Sparkles, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { DFA, DFAState, DFATransition } from '@/lib/dfa/types';

// ─── Mini SVG preview thumbnail ───
const R = 20;

function getMiniPath(from: DFAState, to: DFAState, all: DFATransition[]) {
  if (from.id === to.id) {
    return {
      path: `M ${from.x - R * 0.5} ${from.y - R * 0.85} C ${from.x - R * 1.4} ${from.y - R * 2.5} ${from.x + R * 1.4} ${from.y - R * 2.5} ${from.x + R * 0.5} ${from.y - R * 0.85}`,
      lx: from.x, ly: from.y - R * 2.1,
    };
  }
  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / dist, ny = dy / dist;
  const hasRev = all.some(t => t.from === to.id && t.to === from.id);
  const offset = hasRev ? -15 : 0;
  const sx = from.x + nx * R + (-ny) * offset;
  const sy = from.y + ny * R + nx * offset;
  const ex = to.x - nx * R + (-ny) * offset;
  const ey = to.y - ny * R + nx * offset;
  if (offset !== 0) {
    const mx = (sx + ex) / 2 + (-ny) * 18, my = (sy + ey) / 2 + nx * 18;
    return { path: `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`, lx: mx, ly: my };
  }
  return { path: `M ${sx} ${sy} L ${ex} ${ey}`, lx: (sx + ex) / 2 - ny * 12, ly: (sy + ey) / 2 + nx * 12 };
}

function ExamplePreview({ dfa }: { dfa: DFA }) {
  if (dfa.states.length === 0) return null;
  const xs = dfa.states.map(s => s.x), ys = dfa.states.map(s => s.y);
  const pad = 50;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
  const vb = `${minX} ${minY} ${Math.max(maxX - minX, 200)} ${Math.max(maxY - minY, 140)}`;

  // Group transitions
  const grouped = new Map<string, { from: string; to: string; symbols: string[] }>();
  for (const t of dfa.transitions) {
    const key = `${t.from}->${t.to}`;
    if (!grouped.has(key)) grouped.set(key, { from: t.from, to: t.to, symbols: [] });
    grouped.get(key)!.symbols.push(t.symbol);
  }

  return (
    <svg viewBox={vb} className="w-full h-full" style={{ maxHeight: 120 }}>
      <defs>
        <marker id="prev-arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#a78bfa" opacity={0.8} />
        </marker>
      </defs>
      {[...grouped.values()].map(g => {
        const from = dfa.states.find(s => s.id === g.from);
        const to = dfa.states.find(s => s.id === g.to);
        if (!from || !to) return null;
        const { path, lx, ly } = getMiniPath(from, to, dfa.transitions);
        const label = g.symbols.join(',');
        const lw = Math.max(label.length * 5.5 + 6, 14);
        return (
          <g key={`${g.from}->${g.to}`}>
            <path d={path} fill="none" stroke="#a78bfa" strokeWidth={1.5} opacity={0.6} markerEnd="url(#prev-arr)" />
            <rect x={lx - lw / 2} y={ly - 7} width={lw} height={14} rx={3} fill="#0a0a0a" opacity={0.85} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={8} fontFamily="monospace" fill="#c4b5fd" fontWeight="bold">{label}</text>
          </g>
        );
      })}
      {dfa.states.filter(s => s.isStart).map(s => (
        <path key={`sa-${s.id}`} d={`M ${s.x - R - 28} ${s.y} L ${s.x - R} ${s.y}`} stroke="#a78bfa" strokeWidth={1.5} markerEnd="url(#prev-arr)" opacity={0.7} />
      ))}
      {dfa.states.map(s => (
        <g key={s.id}>
          <circle cx={s.x} cy={s.y} r={R} fill="rgba(139,92,246,0.12)" stroke="#a78bfa" strokeWidth={2} opacity={0.9} />
          {s.isFinal && <circle cx={s.x} cy={s.y} r={R - 5} fill="none" stroke="#a78bfa" strokeWidth={1.5} opacity={0.6} />}
          <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize={s.label.length > 3 ? 7 : 9} fontFamily="monospace" fontWeight="bold" fill="#c4b5fd">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Main Dialog ───
interface ExampleLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExampleLibraryDialog({ open, onOpenChange }: ExampleLibraryDialogProps) {
  const { loadExample } = useDFAStore();
  const [selected, setSelected] = useState<string | null>(null);

  const handleLoad = (id: string) => {
    const idx = EXAMPLE_DFAS.findIndex(e => e.id === id);
    if (idx >= 0) {
      loadExample(idx);
      onOpenChange(false);
      setSelected(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col bg-card border-border">
        <DialogHeader className="shrink-0 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30">
              <BookOpen className="w-4 h-4 text-violet-400" />
            </div>
            Example DFA Library
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {EXAMPLE_DFAS.length} curated examples — click a card to preview, then load it
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-1">
            {EXAMPLE_DFAS.map((ex, i) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <button
                  className={cn(
                    'w-full text-left rounded-xl border transition-all duration-200 overflow-hidden group',
                    selected === ex.id
                      ? 'border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                      : 'border-border bg-background/50 hover:border-violet-500/30 hover:bg-violet-500/5'
                  )}
                  onClick={() => setSelected(selected === ex.id ? null : ex.id)}
                >
                  {/* SVG Preview */}
                  <div className="h-[110px] bg-card/80 flex items-center justify-center px-3 pt-3 border-b border-border/50 overflow-hidden">
                    <ExamplePreview dfa={ex.dfa} />
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-foreground leading-tight group-hover:text-violet-300 transition-colors">
                      {ex.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                      {ex.description}
                    </p>
                    <code className="block text-[9px] text-amber-400/80 font-mono leading-relaxed line-clamp-1" title={ex.language}>
                      {ex.language}
                    </code>
                    <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border text-muted-foreground gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {ex.dfa.states.length} states
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        → {ex.expectedMinStates} min
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400">
                        Σ={'{' + ex.dfa.alphabet.join(',') + '}'}
                      </Badge>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 pt-3 border-t border-border flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">
            {selected
              ? `Selected: ${EXAMPLE_DFAS.find(e => e.id === selected)?.name}`
              : 'Select an example above'}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selected}
              onClick={() => selected && handleLoad(selected)}
              className="gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Load Example
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
