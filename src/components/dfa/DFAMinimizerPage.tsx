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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Moon, Sun, Cpu, Minimize2, Download, Upload,
} from 'lucide-react';

import Toolbar from '@/components/dfa/Toolbar';
import StatePanel from '@/components/dfa/StatePanel';
import StringTester from '@/components/dfa/StringTester';
import MinimizationPanel from '@/components/dfa/MinimizationPanel';
import TransitionSymbolPicker from '@/components/dfa/TransitionSymbolPicker';

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
  const { showMinimized, minimizationResult, exportDFA, importDFA } = useDFAStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
    a.href = url;
    a.download = 'dfa.json';
    a.click();
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
    // Reset so same file can be re-imported
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

            {/* Toolbar (centered) */}
            <div className="hidden md:flex flex-1 justify-center max-w-xl">
              <Toolbar />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {showMinimized && minimizationResult && (
                <Badge variant="secondary" className="px-2.5 py-1 text-xs bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1.5 hidden sm:flex">
                  <Minimize2 className="w-3 h-3" />
                  Minimized View
                </Badge>
              )}

              {/* Export */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={handleExport}>
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Export DFA as JSON</TooltipContent>
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
            <Toolbar />
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
          <div className="flex-1 min-h-[400px] lg:min-h-[600px]">
            <DFACanvas />
          </div>

          {/* Side panel */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden h-full max-h-[600px] lg:max-h-none flex flex-col">
              <Tabs defaultValue="states" className="flex flex-col h-full">
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border bg-transparent h-10 p-0">
                  {[
                    { value: 'states', label: 'States', color: 'violet' },
                    { value: 'test',   label: 'Test',   color: 'emerald' },
                    { value: 'minimize', label: 'Minimize', color: 'amber' },
                  ].map(({ value, label, color }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className={`rounded-none border-b-2 border-transparent data-[state=active]:border-${color}-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs h-10`}
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="states"   className="flex-1 overflow-hidden m-0 h-full"><StatePanel /></TabsContent>
                <TabsContent value="test"     className="flex-1 overflow-hidden m-0 h-full"><StringTester /></TabsContent>
                <TabsContent value="minimize" className="flex-1 overflow-hidden m-0 h-full"><MinimizationPanel /></TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

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
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono">Del</kbd>
                Remove state
              </span>
            </div>
          </div>
        </footer>

        <TransitionSymbolPicker />
      </div>
    </TooltipProvider>
  );
}
