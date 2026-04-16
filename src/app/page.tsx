'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Cpu, ArrowRight, Sparkles, BookOpen, Layers, GitCompareArrows,
  Table2, Play, Download, ChevronDown, Zap, Shield, Brain, Code2,
  Star, Moon, Sun, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ────────────────────────────────────────────────────────────
// Gravity Star Field Canvas
// ────────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number; opacity: number;
      color: string;
    }

    const colors = ['#a78bfa', '#7c3aed', '#c4b5fd', '#818cf8', '#e879f9', '#f472b6', '#ffffff'];
    const COUNT = 160;
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2.2 + 0.4,
      opacity: Math.random() * 0.7 + 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const onMouseMove = (e: MouseEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    let animId: number;
    let frame = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections for close pairs
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - dist / 100) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        // Gravity pull toward mouse (gentle)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = Math.min(60 / (dist * dist + 1), 0.012);
        p.vx += dx * force;
        p.vy += dy * force;

        // Dampen velocity
        p.vx *= 0.985;
        p.vy *= 0.985;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Twinkle
        const twinkle = Math.sin(frame * 0.02 + p.x) * 0.2 + 0.8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * twinkle;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glow for larger stars
        if (p.size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
          grad.addColorStop(0, `${p.color}44`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.globalAlpha = p.opacity * 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}

// ────────────────────────────────────────────────────────────
// Floating DFA preview (animated SVG illustration)
// ────────────────────────────────────────────────────────────
function DFAIllustration() {
  return (
    <motion.div
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      className="w-full max-w-lg mx-auto"
    >
      <svg viewBox="0 0 520 300" className="w-full drop-shadow-2xl" style={{ filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.3))' }}>
        <defs>
          <marker id="h-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 8 4 L 0 8 Z" fill="#a78bfa" opacity="0.9" />
          </marker>
          <marker id="h-arr-g" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" opacity="0.9" />
          </marker>
          <radialGradient id="glow-v" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="glow-g" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Transitions */}
        {/* q0 → q1 */}
        <path d="M 108 150 L 218 100" stroke="#a78bfa" strokeWidth="1.8" fill="none" markerEnd="url(#h-arr)" opacity="0.7" />
        <text x="155" y="110" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#c4b5fd">0</text>
        {/* q0 → q2 */}
        <path d="M 108 150 L 218 200" stroke="#a78bfa" strokeWidth="1.8" fill="none" markerEnd="url(#h-arr)" opacity="0.7" />
        <text x="155" y="195" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#c4b5fd">1</text>
        {/* q1 → q3 */}
        <path d="M 268 88 L 378 88" stroke="#a78bfa" strokeWidth="1.8" fill="none" markerEnd="url(#h-arr)" opacity="0.7" />
        <text x="322" y="80" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#c4b5fd">0,1</text>
        {/* q2 → q3 */}
        <path d="M 268 212 L 378 140" stroke="#a78bfa" strokeWidth="1.8" fill="none" markerEnd="url(#h-arr)" opacity="0.7" />
        <text x="325" y="193" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#c4b5fd">0,1</text>
        {/* q3 self-loop */}
        <path d="M 415 65 C 380 20 450 20 418 65" stroke="#34d399" strokeWidth="1.8" fill="none" markerEnd="url(#h-arr-g)" opacity="0.8" />
        <text x="415" y="25" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#6ee7b7">0,1</text>
        {/* Start arrow */}
        <path d="M 40 150 L 72 150" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#h-arr)" opacity="0.8" />
        <text x="20" y="146" fontSize="10" fill="#a78bfa" opacity="0.6">start</text>

        {/* Glow halos */}
        <circle cx="90" cy="150" r="46" fill="url(#glow-v)" />
        <circle cx="418" cy="112" r="46" fill="url(#glow-g)" />

        {/* States */}
        {[
          { x: 90, y: 150, label: 'q0', final: false, start: true, color: '#7c3aed' },
          { x: 248, y: 88, label: 'q1', final: false, start: false, color: '#7c3aed' },
          { x: 248, y: 212, label: 'q2', final: false, start: false, color: '#7c3aed' },
          { x: 418, y: 112, label: 'q3', final: true, start: false, color: '#059669' },
        ].map(s => (
          <g key={s.label}>
            <circle cx={s.x} cy={s.y} r={36} fill={`${s.color}22`} stroke={s.color} strokeWidth="2" />
            {s.final && <circle cx={s.x} cy={s.y} r={28} fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.6" />}
            <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fontFamily="monospace" fontWeight="bold" fill={s.final ? '#6ee7b7' : '#c4b5fd'}>
              {s.label}
            </text>
          </g>
        ))}

        {/* Minimized arrow */}
        <text x="260" y="270" textAnchor="middle" fontSize="10" fill="#6ee7b7" opacity="0.7" fontFamily="monospace">
          ✦ Minimized: 3 → 2 states
        </text>
      </svg>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Feature Card
// ────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay }: {
  icon: React.ElementType; title: string; desc: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative group rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6 overflow-hidden cursor-default"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${color} rounded-2xl`} />
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-sm font-bold mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Stat Card
// ────────────────────────────────────────────────────────────
function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="text-center space-y-1"
    >
      <Icon className="w-5 h-5 text-violet-400 mx-auto mb-2" />
      <p className="text-3xl font-black bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Home Page
// ────────────────────────────────────────────────────────────
export default function HomePage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme === 'dark';

  const features = [
    { icon: GitCompareArrows, title: 'Myhill–Nerode Minimization', desc: 'Run the full table-filling algorithm with step-by-step visualization showing exactly which state pairs are distinguishable.', color: 'from-violet-600/30 to-purple-600/10', delay: 0 },
    { icon: Play, title: 'Animated String Simulation', desc: 'Watch a token travel along transitions in real-time as you test strings against your DFA, with accept/reject highlighting.', color: 'from-emerald-600/30 to-teal-600/10', delay: 0.08 },
    { icon: Table2, title: 'δ Transition Table', desc: 'View your DFA as a formal transition function table alongside the visual canvas for both original and minimized forms.', color: 'from-sky-600/30 to-blue-600/10', delay: 0.16 },
    { icon: Layers, title: 'Example Library', desc: '8 curated DFA examples covering edge cases: unreachable states, all-accepting, already minimal, and multi-symbol alphabets.', color: 'from-amber-600/30 to-orange-600/10', delay: 0.24 },
    { icon: Download, title: 'Import & Export', desc: 'Export your DFA as JSON for sharing or backup. Import previously saved DFAs. Export the minimized DFA as a PNG image.', color: 'from-pink-600/30 to-rose-600/10', delay: 0.32 },
    { icon: Brain, title: 'Auto-play Steps', desc: 'Let the algorithm run itself at adjustable speed — ideal for presentations, lectures, or self-study sessions.', color: 'from-indigo-600/30 to-violet-600/10', delay: 0.40 },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Star field — dark mode only */}
      {isDark && <StarField />}

      {/* Gradient overlays */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-pink-600/6 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-indigo-600/5 blur-[80px]" />
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-50 sticky top-0 border-b border-border/50 backdrop-blur-xl bg-background/70">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">DFA Minimizer</span>
              <span className="block text-[9px] text-muted-foreground">Interactive Automata Simulator</span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/learn">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 rounded-lg">
                <BookOpen className="w-3.5 h-3.5" />
                Learn
              </Button>
            </Link>
            <Link href="/app">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 rounded-lg">
                <Cpu className="w-3.5 h-3.5" />
                App
              </Button>
            </Link>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
            >
              {mounted && (isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
            </button>
            <Link href="/app">
              <Button size="sm" className="ml-2 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-lg shadow-violet-500/20">
                Launch App
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 min-h-[90vh] flex items-center"
      >
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-5 px-3 py-1 text-xs bg-violet-500/10 text-violet-300 border-violet-500/30 gap-1.5">
                <Sparkles className="w-3 h-3" />
                Myhill–Nerode Theorem · Table-Filling Algorithm
              </Badge>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                <span className="bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
                  Minimize
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                  any DFA
                </span>
                <br />
                <span className="text-foreground/80 text-4xl sm:text-5xl lg:text-6xl">
                  step by step.
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-base text-muted-foreground max-w-md leading-relaxed"
            >
              An interactive web tool that visually teaches the table-filling
              algorithm for DFA minimization. Build automata, test strings,
              and watch state equivalence classes form — all in the browser.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link href="/app">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-xl shadow-violet-500/25 px-7 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-100">
                  <Zap className="w-4 h-4" />
                  Open Minimizer
                </Button>
              </Link>
              <Link href="/learn">
                <Button size="lg" variant="outline" className="gap-2 border-border/60 hover:border-violet-500/50 rounded-xl text-sm px-7">
                  <BookOpen className="w-4 h-4" />
                  Learn Theory
                </Button>
              </Link>
            </motion.div>

            {/* Mini stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6 text-xs text-muted-foreground pt-2"
            >
              {[
                { n: '8', label: 'Example DFAs' },
                { n: '41', label: 'Unit tests' },
                { n: '100%', label: 'Browser-native' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="font-black text-sm text-violet-400">{s.n}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — FloatingDFA */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block"
          >
            <DFAIllustration />
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/40"
        >
          <span className="text-[10px] uppercase tracking-widest">Explore</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.section>

      {/* ── STATS BAND ── */}
      <section className="relative z-10 border-y border-border/50 bg-card/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <StatCard value="O(n²)" label="Table-filling complexity" icon={Brain} />
          <StatCard value="∞" label="Alphabet symbols supported" icon={Code2} />
          <StatCard value="2" label="Live canvases" icon={Layers} />
          <StatCard value="0" label="Dependencies on servers" icon={Shield} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 px-3 py-1 bg-violet-500/10 text-violet-300 border-violet-500/30 text-xs">
              Everything you need
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Built for <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">learning & teaching</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Every feature is designed to make formal language theory tangible — from drawing states to watching the algorithm converge.
            </p>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 border-t border-border/50 bg-card/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-3">
              How <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">minimization</span> works
            </h2>
            <p className="text-sm text-muted-foreground">5 steps from any DFA to its minimal equivalent</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Remove unreachable', desc: 'BFS from start state — remove states never visited', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
              { step: '2', title: 'Make total', desc: 'Inject a dead/trap state for missing transitions', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
              { step: '3', title: 'Base case', desc: 'Mark all (final, non-final) pairs as distinguishable', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              { step: '4', title: 'Propagate', desc: 'Follow transitions to mark more pairs iteratively', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
              { step: '5', title: 'Merge', desc: 'Unmarked pairs → same equivalence class → one state', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-5 ${s.bg}`}
              >
                <div className={`text-3xl font-black ${s.color} mb-3`}>{s.step}</div>
                <p className="text-xs font-bold mb-1">{s.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/learn">
              <Button variant="outline" className="gap-2 rounded-xl border-violet-500/30 hover:border-violet-500/60 text-sm">
                <BookOpen className="w-4 h-4" />
                Read full theory on the Learn page
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-violet-500/20 bg-gradient-to-br from-violet-950/60 via-purple-900/30 to-pink-950/40 p-12 lg:p-16 text-center"
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-pink-600/10 blur-3xl" />
          <div className="relative z-10">
            <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-5" />
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Ready to minimize your DFA?
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              Build your automaton, run the algorithm, and export the result — all in your browser, no account needed.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/app">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-2xl shadow-violet-500/30 rounded-xl px-8 font-semibold transition-all hover:scale-105">
                  <Zap className="w-4 h-4" />
                  Open Minimizer
                </Button>
              </Link>
              <Link href="/learn">
                <Button size="lg" variant="outline" className="gap-2 rounded-xl border-white/20 hover:bg-white/5 px-8">
                  <BookOpen className="w-4 h-4" />
                  Learn First
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-border/50 bg-card/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-white" />
            </div>
            <span>DFA Minimizer — Myhill–Nerode Algorithm</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/app" className="hover:text-foreground transition-colors flex items-center gap-1">
              App <ExternalLink className="w-3 h-3" />
            </Link>
            <Link href="/learn" className="hover:text-foreground transition-colors">Learn</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
