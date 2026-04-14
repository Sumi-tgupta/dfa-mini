'use client';

import React from 'react';
import { useDFAStore } from '@/lib/dfa/store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  MousePointer2,
  PlusCircle,
  ArrowRightLeft,
  Trash2,
  RotateCcw,
  Play,
  BookOpen,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tools = [
  { id: 'select' as const, label: 'Select & Move', icon: MousePointer2, shortcut: 'S' },
  { id: 'add-state' as const, label: 'Add State', icon: PlusCircle, shortcut: 'A' },
  { id: 'connect' as const, label: 'Connect States', icon: ArrowRightLeft, shortcut: 'C' },
  { id: 'delete' as const, label: 'Delete', icon: Trash2, shortcut: 'D' },
];

export default function Toolbar() {
  const { mode, setMode, resetDFA, loadExample, minimize, resetMinimization, showMinimized, setShowMinimized } = useDFAStore();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-2">
        {/* Tool group */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
          {tools.map(tool => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode(tool.id)}
                  className={cn(
                    'gap-2 px-3 h-9 rounded-lg transition-all',
                    mode === tool.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tool.icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">{tool.label}</span>
                  <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-background/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    {tool.shortcut}
                  </kbd>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {tool.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Action buttons */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadExample}
              className="gap-2 h-9 px-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Example</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Load example DFA
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (showMinimized) {
                  setShowMinimized(false);
                  resetMinimization();
                } else {
                  minimize();
                }
              }}
              disabled={useDFAStore.getState().states.length < 2}
              className="gap-2 h-9 px-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              {showMinimized ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Original</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Minimize</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {showMinimized ? 'Show original DFA' : 'Minimize DFA'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetDFA}
              className="gap-2 h-9 px-3 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Reset</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Clear all states and transitions
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
