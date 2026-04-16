'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Cpu, ArrowRight, ChevronDown, ChevronUp, ArrowLeft,
  CheckCircle2, X, Layers, Zap, Brain, Code2, Star, Sparkles,
  Table2, GitCompareArrows, AlertTriangle, Info, Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────────
// Accordion section
// ────────────────────────────────────────────────────────────
function AccordionSection({
  id, title, icon: Icon, badge, children, defaultOpen = false,
}: {
  id: string; title: string; icon: React.ElementType;
  badge?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-accent/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-sm font-semibold text-left">{title}</span>
          {badge && (
            <Badge className="text-[9px] px-1.5 py-0 bg-violet-500/10 text-violet-400 border-violet-500/20">{badge}</Badge>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-1 border-t border-border/50 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────────────────
function Callout({ type, children }: { type: 'info' | 'tip' | 'warning'; children: React.ReactNode }) {
  const config = {
    info: { icon: Info, bg: 'bg-blue-500/10 border-blue-500/25', text: 'text-blue-300', icon_c: 'text-blue-400' },
    tip: { icon: Lightbulb, bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-200', icon_c: 'text-emerald-400' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-200', icon_c: 'text-amber-400' },
  }[type];
  const Icon = config.icon;
  return (
    <div className={`flex gap-3 px-4 py-3 rounded-xl border ${config.bg}`}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.icon_c}`} />
      <p className={`text-xs leading-relaxed ${config.text}`}>{children}</p>
    </div>
  );
}

function CodeBlock({ children, caption }: { children: string; caption?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border">
      {caption && (
        <div className="px-4 py-2 bg-muted/40 border-b border-border text-[10px] text-muted-foreground font-mono">{caption}</div>
      )}
      <pre className="px-4 py-4 font-mono text-[11px] leading-relaxed overflow-x-auto text-foreground/85 bg-card/60">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Term({ word, def }: { word: string; def: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        className="underline decoration-dotted text-violet-400 hover:text-violet-300 transition-colors text-xs"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {word}
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute z-50 bottom-full left-0 mb-2 w-56 px-3 py-2.5 rounded-xl border border-border bg-card shadow-2xl text-[10px] text-muted-foreground leading-relaxed"
          >
            {def}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// Interactive distinguishability table demo
function TableDemo() {
  const states = ['q0', 'q1', 'q2', 'q3', 'q4'];
  const isFinal = new Set(['q3', 'q4']);
  const [step, setStep] = useState(0);

  // Pre-computed pairs per step
  const stepData = [
    { marked: new Set<string>(), label: 'Initial: all pairs unmarked (equivalent)' },
    {
      marked: new Set(['q0-q3', 'q0-q4', 'q1-q3', 'q1-q4', 'q2-q3', 'q2-q4']),
      label: 'Base case: mark (final, non-final) pairs'
    },
    {
      marked: new Set(['q0-q3', 'q0-q4', 'q1-q3', 'q1-q4', 'q2-q3', 'q2-q4', 'q0-q1', 'q0-q2']),
      label: 'Propagate: mark pairs whose transitions lead to marked pair'
    },
    {
      marked: new Set(['q0-q3', 'q0-q4', 'q1-q3', 'q1-q4', 'q2-q3', 'q2-q4', 'q0-q1', 'q0-q2']),
      label: 'Converged! Unmarked: (q1,q2) and (q3,q4) → merge them'
    },
  ];

  const current = stepData[step];

  function isMarked(a: string, b: string) {
    const k1 = `${a}-${b}`, k2 = `${b}-${a}`;
    return current.marked.has(k1) || current.marked.has(k2);
  }
  function isNew(a: string, b: string) {
    if (step === 0) return false;
    const prev = stepData[step - 1].marked;
    const k1 = `${a}-${b}`, k2 = `${b}-${a}`;
    return !prev.has(k1) && !prev.has(k2) && (current.marked.has(k1) || current.marked.has(k2));
  }

  const n = states.length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className={cn(
          'text-xs px-3 py-2 rounded-lg border font-medium',
          step === 3 ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
        )}>
          {current.label}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Prev</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStep(s => Math.min(stepData.length - 1, s + 1))} disabled={step === stepData.length - 1}>Next →</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse mx-auto">
          <thead>
            <tr>
              <th className="w-10 h-8" />
              {states.slice(0, n - 1).map(l => (
                <th key={l} className="w-10 h-8 text-center text-[10px] font-mono text-muted-foreground">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {states.slice(1).map((row, ri) => {
              const cur = states[ri + 1];
              return (
                <tr key={row}>
                  <td className="h-10 text-center text-[10px] font-mono text-muted-foreground pr-1">{row}</td>
                  {Array.from({ length: ri + 1 }, (_, ci) => {
                    const col = states[ci];
                    const marked = isMarked(cur, col);
                    const newMark = isNew(cur, col);
                    return (
                      <td key={ci} className="w-10 h-10 p-0.5">
                        <motion.div
                          animate={newMark ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                          transition={{ duration: 0.4 }}
                          className={cn(
                            'w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-[9px] font-mono transition-all duration-400',
                            newMark ? 'bg-red-500/30 border-2 border-red-400' :
                            marked ? 'bg-red-500/15 border border-red-500/40' :
                            'bg-emerald-500/10 border border-emerald-500/20'
                          )}
                        >
                          {marked ? <X className="w-3.5 h-3.5 text-red-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />}
                        </motion.div>
                      </td>
                    );
                  })}
                  {Array.from({ length: n - 2 - ri }, (_, i) => <td key={`e${i}`} className="w-10 h-10" />)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 text-[10px] text-muted-foreground mt-1 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center inline-flex"><CheckCircle2 className="w-2 h-2 text-emerald-400" /></span> Equivalent (will merge)</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-500/15 border border-red-500/40 flex items-center justify-center inline-flex"><X className="w-2 h-2 text-red-400" /></span> Distinguishable</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-500/30 border-2 border-red-400 inline-block" /> Newly marked this step</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// LEARN PAGE
// ────────────────────────────────────────────────────────────
const topics = [
  { id: 'dfa', label: 'What is a DFA?' },
  { id: 'language', label: 'Formal Languages' },
  { id: 'minimization', label: 'Why Minimize?' },
  { id: 'algorithm', label: 'Table-Filling Algorithm' },
  { id: 'nerode', label: 'Myhill–Nerode Theorem' },
  { id: 'practice', label: 'Practice & Tips' },
];

export default function LearnPage() {
  const [activeSection, setActiveSection] = useState('dfa');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Gradient bg */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/6 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-emerald-600/4 blur-[80px]" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/70">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
                <ArrowLeft className="w-3.5 h-3.5" />
                Home
              </Button>
            </Link>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold">Learn</span>
              <Badge className="text-[9px] px-1.5 py-0 bg-violet-500/10 text-violet-400 border-violet-500/20">Theory</Badge>
            </div>
          </div>
          <Link href="/app">
            <Button size="sm" className="gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
              <Zap className="w-3.5 h-3.5" />
              Open App
            </Button>
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-24 h-fit">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 px-3">Contents</p>
          <div className="space-y-0.5">
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveSection(t.id);
                  document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-xs transition-all',
                  activeSection === t.id
                    ? 'bg-violet-500/15 text-violet-300 font-semibold'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <Link href="/app">
              <Button size="sm" className="w-full gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white">
                <Zap className="w-3 h-3" />
                Try the App
              </Button>
            </Link>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 max-w-3xl space-y-5">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black mb-3">
              DFA Theory & <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Minimization</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              A complete guide to Deterministic Finite Automata — from basic definitions to the Myhill–Nerode theorem.
              Click any section below to expand it, then open the app to practice.
            </p>
          </div>

          {/* ─── SECTION 1: What is a DFA ─── */}
          <div id="dfa">
            <AccordionSection id="dfa" title="What is a Deterministic Finite Automaton (DFA)?" icon={Cpu} defaultOpen badge="Fundamentals">
              <p className="text-xs text-muted-foreground leading-relaxed">
                A <strong className="text-foreground">Deterministic Finite Automaton</strong> is a mathematical model of computation.
                It reads an input string one character at a time and transitions between a finite set of states based on defined rules.
                At the end, it either <em>accepts</em> or <em>rejects</em> the string.
              </p>

              <Callout type="info">
                A DFA is formally defined as a 5-tuple: <strong>M = (Q, Σ, δ, q₀, F)</strong> where Q is the set of states, Σ is the input alphabet, δ is the transition function, q₀ is the start state, and F ⊆ Q is the set of accepting states.
              </Callout>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { sym: 'Q', name: 'States', desc: 'A finite set of states the machine can be in. Example: {q0, q1, q2}' },
                  { sym: 'Σ', name: 'Alphabet', desc: 'The finite set of input symbols. Example: {0, 1} or {a, b, c}' },
                  { sym: 'δ', name: 'Transition fn.', desc: 'δ: Q × Σ → Q maps (state, symbol) → next state. Must be total.' },
                  { sym: 'q₀', name: 'Start state', desc: 'The state where computation begins. Exactly one start state.' },
                  { sym: 'F', name: 'Accept states', desc: 'Subset of Q. If computation ends here, the string is accepted.' },
                ].map(c => (
                  <div key={c.sym} className="rounded-xl border border-border bg-card/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-black font-mono text-violet-400">{c.sym}</span>
                      <span className="text-xs font-semibold">{c.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>

              <CodeBlock caption="Example DFA accepting strings ending in '1' over Σ={0,1}">
{`States:      Q = {A, B}
Alphabet:    Σ = {0, 1}
Start:       q₀ = A
Accept:      F = {B}

Transitions:
  δ(A, 0) = A     (stay, still no trailing 1)
  δ(A, 1) = B     (found a 1, now accepting)
  δ(B, 0) = A     (tail broken, go back)
  δ(B, 1) = B     (stay in accepting)

Test "101": A →¹ B →⁰ A →¹ B  ✓ ACCEPT
Test "110": A →¹ B →¹ B →⁰ A  ✗ REJECT`}
              </CodeBlock>

              <Callout type="tip">
                In the DFA Minimizer app, double-click a state to toggle it as a final state. States are automatically labeled and you can drag them anywhere on the canvas.
              </Callout>
            </AccordionSection>
          </div>

          {/* ─── SECTION 2: Formal Languages ─── */}
          <div id="language">
            <AccordionSection id="language" title="Formal Languages & Regular Languages" icon={Code2} badge="Theory">
              <p className="text-xs text-muted-foreground leading-relaxed">
                A <strong className="text-foreground">language</strong> L is simply a set of strings over some alphabet Σ.
                A <strong className="text-foreground">regular language</strong> is any language that can be recognized by a DFA.
                This is an enormously important class — it includes patterns we use every day.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { title: 'Regular (DFA-recognizable)', items: ['Strings ending in "01"', 'Strings with even number of 0s', 'Strings not containing "ab"', 'Binary numbers divisible by 3'], badge: '✓', color: 'border-emerald-500/25 bg-emerald-500/5' },
                  { title: 'Not Regular (need more power)', items: ['Strings of the form aⁿbⁿ', 'Palindromes', 'Balanced parentheses', 'Prime-length strings'], badge: '✗', color: 'border-red-500/25 bg-red-500/5' },
                ].map(col => (
                  <div key={col.title} className={`rounded-xl border p-4 ${col.color}`}>
                    <p className="text-[11px] font-semibold mb-3">{col.title}</p>
                    {col.items.map(item => (
                      <div key={item} className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
                        <span className={col.badge === '✓' ? 'text-emerald-400' : 'text-red-400'}>{col.badge}</span>
                        {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <Callout type="info">
                The <Term word="Pumping Lemma" def="A theorem stating that every regular language has a 'pumping length' p such that any string of length ≥ p can be pumped (a middle section repeated) and still stay in the language." /> is commonly used to prove a language is NOT regular.
              </Callout>
            </AccordionSection>
          </div>

          {/* ─── SECTION 3: Why Minimize ─── */}
          <div id="minimization">
            <AccordionSection id="minimization" title="Why Minimize a DFA?" icon={GitCompareArrows} badge="Motivation">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multiple different DFAs can recognize exactly the same language. Some are unnecessarily large due to:
              </p>

              <div className="space-y-2">
                {[
                  { title: 'Equivalent states', desc: 'Two states that behave identically for all future inputs — they can be merged.', icon: Layers },
                  { title: 'Unreachable states', desc: 'States that can never be reached from the start state for any input.', icon: AlertTriangle },
                  { title: 'Redundant dead states', desc: 'Multiple trap states that all reject everything — only one is needed.', icon: X },
                ].map(r => (
                  <div key={r.title} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card/30 text-xs">
                    <r.icon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{r.title}: </span>
                      <span className="text-muted-foreground">{r.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Callout type="tip">
                The <strong>minimal DFA</strong> for a regular language is unique (up to state renaming). This makes minimization a powerful tool for testing language equivalence: if two DFAs minimize to the same form, they accept the same language.
              </Callout>

              <div className="rounded-xl border border-border bg-card/40 p-4">
                <p className="text-xs font-semibold mb-2">Practical applications:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  {[
                    'Compiler lexer optimization',
                    'Pattern matching engines',
                    'Hardware circuit simplification',
                    'Protocol state machine compression',
                    'Network packet filter optimization',
                    'Equivalence checking in verification',
                  ].map(a => (
                    <div key={a} className="flex items-center gap-1.5">
                      <Star className="w-2.5 h-2.5 text-violet-400 shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </AccordionSection>
          </div>

          {/* ─── SECTION 4: Algorithm ─── */}
          <div id="algorithm">
            <AccordionSection id="algorithm" title="The Table-Filling Algorithm — Step by Step" icon={Table2} badge="Core Algorithm">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Also called the <strong className="text-foreground">Mark algorithm</strong> or <strong className="text-foreground">Hopcroft-Moore algorithm</strong>.
                It fills an upper-triangular table of state pairs, marking distinguishable pairs.
              </p>

              {[
                { n: 'Step 1', t: 'Remove unreachable states', desc: 'Run BFS/DFS from the start state. Any state never visited is unreachable and safe to delete without affecting the language.', color: 'border-violet-500/25 bg-violet-500/5 text-violet-300' },
                { n: 'Step 2', t: 'Make the DFA complete (total)', desc: 'Every state must have exactly one transition per symbol. If δ(q, a) is undefined, create a dead/trap state that absorbs all transitions and rejects all strings.', color: 'border-sky-500/25 bg-sky-500/5 text-sky-300' },
                { n: 'Step 3', t: 'Base case: mark (final, non-final) pairs', desc: 'A final state accepts ε (empty string) while a non-final state rejects it. So any pair (p, q) where exactly one is final is immediately distinguishable.', color: 'border-amber-500/25 bg-amber-500/5 text-amber-300' },
                { n: 'Step 4', t: 'Inductive step: propagate marks', desc: 'For each unmarked pair (p, q) and each symbol σ: if (δ(p,σ), δ(q,σ)) is already marked, then (p, q) is also distinguishable — mark it. Repeat until no new marks.', color: 'border-orange-500/25 bg-orange-500/5 text-orange-300' },
                { n: 'Step 5', t: 'Merge equivalence classes', desc: 'Unmarked pairs are equivalent. Use Union-Find to group them into equivalence classes. Each class becomes one state in the minimized DFA.', color: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-300' },
              ].map(s => (
                <div key={s.n} className={`rounded-xl border p-4 ${s.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-[9px] px-1.5 py-0 ${s.color} border-current`}>{s.n}</Badge>
                    <span className="text-xs font-semibold">{s.t}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-80">{s.desc}</p>
                </div>
              ))}

              <div>
                <p className="text-xs font-semibold mb-3">Interactive Demo — Classic 5-State DFA</p>
                <TableDemo />
              </div>

              <CodeBlock caption="Pseudo-code for the table-filling algorithm">
{`function minimizeDFA(Q, Σ, δ, q₀, F):
  // Step 1: remove unreachable
  reachable = BFS(q₀, δ)
  Q = Q ∩ reachable

  // Step 2: complete (add dead state if needed)
  if ∃ q ∈ Q, a ∈ Σ : δ(q,a) undefined:
    Q = Q ∪ {dead}
    fill δ(q,a) = dead for all missing

  // Step 3: base case
  table[p][q] = (p ∈ F) XOR (q ∈ F)  for all p≠q

  // Step 4: propagation
  repeat until no changes:
    for each unmarked (p, q):
      for each a ∈ Σ:
        if table[δ(p,a)][δ(q,a)] == marked:
          table[p][q] = marked; break

  // Step 5: merge
  classes = UnionFind({ q ∈ Q })
  for each unmarked (p, q):
    classes.union(p, q)
  return buildDFA(classes)`}
              </CodeBlock>
            </AccordionSection>
          </div>

          {/* ─── SECTION 5: Myhill-Nerode ─── */}
          <div id="nerode">
            <AccordionSection id="nerode" title="The Myhill–Nerode Theorem" icon={Brain} badge="Advanced">
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Myhill–Nerode theorem gives the deepest characterization of regular languages and directly explains why DFA minimization works.
              </p>

              <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4">
                <p className="text-xs font-bold text-violet-300 mb-2">The Theorem</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  A language L is regular <strong className="text-foreground">if and only if</strong> its <Term word="Myhill-Nerode equivalence" def="Two strings x,y are Nerode-equivalent (x ≡_L y) if for every suffix z, xz ∈ L ↔ yz ∈ L. That is, they are indistinguishable by any future input." /> relation ≡_L has finitely many equivalence classes.
                  Moreover, the number of equivalence classes equals the number of states in the <em>unique minimal DFA</em> for L.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold">Distinguishability (Nerode relation):</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Two strings x and y are <em>distinguishable</em> w.r.t. L if there exists a <Term word="distinguishing extension" def="A string z such that exactly one of xz or yz is in L. This z 'witnesses' that x and y lead to different futures." /> z such that exactly one of {'{'}xz, yz{'}'} is in L. The equivalence classes of ≡_L correspond exactly to the states of the minimal DFA.
                </p>
              </div>

              <Callout type="info">
                This is why the table-filling algorithm works: it finds pairs of states that are Nerode-distinguishable by propagating from base cases. Unmarked pairs are Nerode-equivalent and must be merged.
              </Callout>

              <CodeBlock caption="Example: L = {w | w ends in '1'}">
{`Equivalence classes of ≡_L:
  [ε] = {w | w ends in 0 or w = ε}   → state A (non-accepting)
  [1] = {w | w ends in 1}             → state B (accepting)

Distinguishing extension for A vs B:
  z = ε (empty string)
  εz = ε ∉ L  but  1z = 1 ∈ L  → distinguishable

Result: exactly 2 equivalence classes → minimal DFA has 2 states ✓`}
              </CodeBlock>
            </AccordionSection>
          </div>

          {/* ─── SECTION 6: Practice ─── */}
          <div id="practice">
            <AccordionSection id="practice" title="Practice, Tips & Common Mistakes" icon={Lightbulb} badge="Practice">
              <div className="space-y-3">
                {[
                  { q: 'What if no states are equivalent?', a: 'Every pair gets marked. All states in the original DFA are distinguishable, so the DFA is already minimal. The table-filling algorithm confirms this formally.' },
                  { q: 'What if all states are equivalent?', a: 'This happens when all states have the same "accept/reject" status (e.g., all 3 final states reduce to 1). The result is a single-state DFA.' },
                  { q: 'Can the minimized DFA be larger?', a: 'Never. The algorithm can only merge states, never split them. The minimized DFA always has ≤ states than the original.' },
                  { q: 'What about incomplete DFAs?', a: 'Missing transitions must be completed by adding a dead/trap state. This ensures δ is total before running the algorithm — the tool does this automatically.' },
                  { q: 'How do I test my DFA is correct?', a: 'Test strings you know should be accepted and rejected. The built-in String Tester shows the step-by-step path through states, making it easy to spot errors.' },
                ].map(faq => (
                  <details key={faq.q} className="group rounded-xl border border-border bg-card/30 overflow-hidden">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-xs font-semibold list-none hover:bg-accent/20 transition-colors">
                      {faq.q}
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-3 pt-1 text-[11px] text-muted-foreground leading-relaxed border-t border-border/50">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>

              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5" />
                  Pro Tips
                </p>
                {[
                  'Use the Example Library to load edge cases (unreachable states, all-accepting, etc.) and see how minimization handles them.',
                  'Enable "Auto-play" in the steps panel to watch the algorithm run itself — great for presentations.',
                  'The δ Table tab shows the formal transition function alongside the visual canvas.',
                  'Export your minimized DFA as PNG with the button on the minimized canvas for reports/homework.',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-emerald-200/70">
                    <span className="text-emerald-400 font-mono text-xs shrink-0">{i + 1}.</span>
                    {tip}
                  </div>
                ))}
              </div>
            </AccordionSection>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-purple-900/20 p-8 text-center mt-4"
          >
            <Sparkles className="w-7 h-7 text-violet-400 mx-auto mb-4" />
            <h3 className="text-lg font-black mb-2">Ready to try it yourself?</h3>
            <p className="text-xs text-muted-foreground mb-5 max-w-sm mx-auto">
              Open the interactive DFA Minimizer, build an automaton, and run the table-filling algorithm with live step-by-step visualization.
            </p>
            <Link href="/app">
              <Button className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/20 rounded-xl px-8 transition-all hover:scale-105">
                <Zap className="w-4 h-4" />
                Open DFA Minimizer
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
