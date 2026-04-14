'use client';

import React from 'react';
import { useDFAStore } from '@/lib/dfa/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TransitionSymbolPicker() {
  const editingTransition = useDFAStore(s => s.editingTransition);
  const alphabet = useDFAStore(s => s.alphabet);
  const updateTransitionSymbol = useDFAStore(s => s.updateTransitionSymbol);
  const setEditingTransition = useDFAStore(s => s.setEditingTransition);
  const removeTransition = useDFAStore(s => s.removeTransition);

  if (!editingTransition) return null;

  const handleClose = () => setEditingTransition(null);

  return (
    <Dialog open={!!editingTransition} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">
            Transition Symbol
            <span className="ml-2 text-xs text-muted-foreground font-mono font-normal">
              {editingTransition.from} → {editingTransition.to}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mt-2">
          {alphabet.map(sym => (
            <Button
              key={sym}
              variant="outline"
              className={cn(
                'w-12 h-12 font-mono text-lg rounded-xl transition-all',
                editingTransition.symbol === sym
                  ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                  : 'hover:bg-accent hover:text-foreground'
              )}
              onClick={() => {
                updateTransitionSymbol(editingTransition.id, sym);
                handleClose();
              }}
            >
              {sym}
            </Button>
          ))}
        </div>

        {alphabet.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No alphabet symbols defined. Add symbols in the States tab.
          </p>
        )}

        {/* BUG FIX: was "Cancel" but actually deleted the transition.
            Now there are two separate actions: close (keep) and delete. */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              removeTransition(editingTransition.id);
              handleClose();
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete transition
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
