'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Moon, Sun, Cpu, Download, Upload, PlusCircle, BookOpen, Sparkles,
  Keyboard, Table2,
} from 'lucide-react';

import Toolbar from '@/components/dfa/Toolbar';
import StatePanel from '@/components/dfa/StatePanel';
import StringTester from '@/components/dfa/StringTester';
import MinimizationSection from '@/components/dfa/MinimizationSection';
import TransitionSymbolPicker from '@/components/dfa/TransitionSymbolPicker';
import ExampleLibraryDialog from '@/components/dfa/ExampleLibraryDialog';
import ShortcutGuide from '@/components/dfa/ShortcutGuide';
import TransitionTableView from '@/components/dfa/TransitionTableView';

const DFACanvas = dynamic(() => import('@/components/dfa/DFACanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Loading canvas…
    </div>
  ),
});

import { useDFAStore } from '@/lib/dfa/store';

export default function DFAMinimizerPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useHydrated();
  const { minimizationResult, exportDFA, importDFA } = useDFAStore();
  const stateCount = useDFAStore(s => s.states.length);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exampleOpen, setExampleOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useDFAStore.getState().undo();
        return;
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useDFAStore.getState().redo();
        return;
      }
      // Export: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        // trigger export
        const json = useDFAStore.getState().exportDFA();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'dfa.json'; a.click();
        URL.revokeObjectURL(url);
        return;
      }
      // Shortcut guide: ?
      if (e.key === '?') { setShortcutOpen(true); return; }

      switch (e.key.toLowerCase()) {
        case 's': useDFAStore.getState().setMode('select'); break;
        case 'a': useDFAStore.getState().setMode('add-state'); break;
        case 'c': useDFAStore.getState().setMode('connect'); break;
        case 'd': useDFAStore.getState().setMode('delete'); break;
        case 'escape':
          useDFAStore.getState().setMode('select');
          useDFAStore.getState().setSelectedState(null);
          useDFAStore.getState().setConnectingFrom(null);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Export handler
  const handleExport = () => {
    const json = exportDFA();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dfa.json'; a.click();
    URL.revokeObjectURL(url);
  };

  // Import handler
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importDFA(text);
      if (!result.success) {
        setImportError(result.error ?? 'Unknown error');
        setTimeout(() => setImportError(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen flex flex-col bg-background text-foreground">

        {/* ─── HEADER ─── */}
        <header className="sticky top-0 z-50 border-b border-border backdrop-blur-xl bg-background/80">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            {/* Logo + Title */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-amber-500 shadow-lg shadow-violet-500/20">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight">DFA Minimizer</h1>
                <p className="text-[10px] text-muted-foreground hidden sm:block">
                  Interactive Deterministic Finite Automaton Simulator
                </p>
              </div>
            </div>

            {/* Toolbar (centered) — pass dialog opener */}
            <div className="hidden md:flex flex-1 justify-center max-w-2xl">
              <Toolbar onOpenExamples={() => setExampleOpen(true)} />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {minimizationResult && (
                <Badge variant="secondary" className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 hidden sm:flex">
                  <Sparkles className="w-3 h-3" />
                  Minimized
                </Badge>
              )}

              {/* Export */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={handleExport}>
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Export DFA as JSON (Ctrl+D)</TooltipContent>
              </Tooltip>

              {/* Import */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Import DFA from JSON</TooltipContent>
              </Tooltip>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

              {/* Shortcut guide */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setShortcutOpen(true)}>
                    <Keyboard className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Keyboard shortcuts (?)</TooltipContent>
              </Tooltip>

              {/* Theme toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost" size="icon" className="h-9 w-9 rounded-lg"
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  >
                    {!mounted ? <Sun className="w-4 h-4" />
                      : resolvedTheme === 'dark' ? <Sun className="w-4 h-4" />
                      : <Moon className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Toggle {resolvedTheme === 'dark' ? 'light' : 'dark'} mode
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Mobile toolbar */}
          <div className="md:hidden px-4 pb-3">
            <Toolbar onOpenExamples={() => setExampleOpen(true)} />
          </div>

          {/* Import error banner */}
          {importError && (
            <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 text-xs text-destructive text-center">
              Import failed: {importError}
            </div>
          )}
        </header>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-4 flex flex-col lg:flex-row gap-4">
          {/* Canvas */}
          <div className="flex-1 min-h-[400px] lg:min-h-[600px] relative">
            <DFACanvas />

            {/* Welcome overlay when empty */}
            {stateCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto bg-card/90 backdrop-blur-md border border-border rounded-2xl p-8 max-w-sm text-center shadow-2xl">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-amber-500/20 border border-violet-500/30 mx-auto mb-4">
                    <Cpu className="w-7 h-7 text-violet-400" />
                  </div>
                  <h2 className="text-lg font-bold mb-2">Welcome to DFA Minimizer</h2>
                  <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                    Build a DFA, simulate strings, and minimize it step-by-step using the
                    Myhill–Nerode table-filling algorithm.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setExampleOpen(true)}
                      className="gap-2 bg-violet-600 hover:bg-violet-700 text-white w-full"
                    >
                      <BookOpen className="w-4 h-4" />
                      Browse Example DFAs
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => useDFAStore.getState().setMode('add-state')}
                      className="gap-2 w-full"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Start from Scratch
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                    {(['S','A','C','D'] as const).map((key, i) => (
                      <span key={key} className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono">{key}</kbd>
                        {['Select','Add','Connect','Delete'][i]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side panel — 3 tabs: States · Test · Table */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden h-full max-h-[600px] lg:max-h-none flex flex-col">
              <Tabs defaultValue="states" className="flex flex-col h-full">
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border bg-transparent h-10 p-0">
                  <TabsTrigger
                    value="states"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs h-10"
                  >
                    States
                  </TabsTrigger>
                  <TabsTrigger
                    value="test"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs h-10"
                  >
                    Test
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs h-10 gap-1"
                  >
                    <Table2 className="w-3 h-3" />
                    δ Table
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="states" className="flex-1 overflow-hidden m-0 h-full"><StatePanel /></TabsContent>
                <TabsContent value="test" className="flex-1 overflow-hidden m-0 h-full"><StringTester /></TabsContent>
                <TabsContent value="table" className="flex-1 overflow-hidden m-0 h-full"><TransitionTableView /></TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

        {/* ─── MINIMIZATION SECTION ─── */}
        <MinimizationSection />

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-border py-4 mt-auto">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>DFA Minimizer — Table-Filling (Myhill–Nerode) Algorithm</span>
            <div className="flex items-center gap-3">
              {(['S','A','C','D'] as const).map((key, i) => (
                <span key={key} className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono">{key}</kbd>
                  {['Select','Add','Connect','Delete'][i]}
                </span>
              ))}
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono">?</kbd>
                Shortcuts
              </span>
            </div>
          </div>
        </footer>

        <TransitionSymbolPicker />
        <ExampleLibraryDialog open={exampleOpen} onOpenChange={setExampleOpen} />
        <ShortcutGuide open={shortcutOpen} onOpenChange={setShortcutOpen} />
      </div>
    </TooltipProvider>
  );
}
