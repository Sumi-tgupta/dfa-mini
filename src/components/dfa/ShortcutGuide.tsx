'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Keyboard, MousePointer2, PlusCircle, ArrowRightLeft, Trash2,
  Undo2, Redo2, BookOpen, Sparkles, RotateCcw, Download, Upload,
  ZapOff, ZoomIn,
} from 'lucide-react';

interface ShortcutRowProps {
  keys: string[];
  description: string;
}
function ShortcutRow({ keys, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <React.Fragment key={k}>
            {i > 0 && <span className="text-[10px] text-muted-foreground/50">+</span>}
            <kbd className="px-2 py-0.5 rounded-md border border-border bg-background text-[10px] font-mono font-semibold text-foreground shadow-sm">
              {k}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mt-4 mb-1 first:mt-0">
      <Icon className="w-3.5 h-3.5 text-violet-400" />
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</p>
    </div>
  );
}

interface ShortcutGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShortcutGuide({ open, onOpenChange }: ShortcutGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader className="pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30">
              <Keyboard className="w-4 h-4 text-violet-400" />
            </div>
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            All keyboard shortcuts for the DFA Minimizer
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 max-h-[60vh] overflow-y-auto">
          <SectionTitle icon={MousePointer2} title="Tools" />
          <ShortcutRow keys={['S']} description="Select & Move mode" />
          <ShortcutRow keys={['A']} description="Add State mode" />
          <ShortcutRow keys={['C']} description="Connect States mode" />
          <ShortcutRow keys={['D']} description="Delete mode" />
          <ShortcutRow keys={['Esc']} description="Cancel / back to Select" />

          <SectionTitle icon={Trash2} title="Editing" />
          <ShortcutRow keys={['Del']} description="Delete selected state" />
          <ShortcutRow keys={['Ctrl', 'Z']} description="Undo" />
          <ShortcutRow keys={['Ctrl', 'Y']} description="Redo" />
          <ShortcutRow keys={['Ctrl', 'Shift', 'Z']} description="Redo (alternate)" />

          <SectionTitle icon={MousePointer2} title="Canvas Interaction" />
          <ShortcutRow keys={['Click']} description="Add state (in Add mode)" />
          <ShortcutRow keys={['Double-click']} description="Toggle final state" />
          <ShortcutRow keys={['Drag']} description="Move state (in Select mode)" />

          <SectionTitle icon={Sparkles} title="Actions" />
          <ShortcutRow keys={['Ctrl', 'D']} description="Download / Export DFA" />
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-mono">?</kbd> anytime to open this guide
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
