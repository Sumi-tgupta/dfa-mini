'use client';

import React, { useState } from 'react';
import { useDFAStore } from '@/lib/dfa/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Toggle } from '@/components/ui/toggle';
import {
  Table2,
  Trash2,
  Play,
  Plus,
  X,
  Star,
  CircleDot,
  Edit2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatePanel() {
  const {
    states,
    transitions,
    alphabet,
    selectedStateId,
    setSelectedState,
    removeState,
    toggleStartState,
    toggleFinalState,
    renameState,
    addSymbol,
    removeSymbol,
  } = useDFAStore();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newSymbol, setNewSymbol] = useState('');

  const selectedState = states.find(s => s.id === selectedStateId);

  const handleRename = () => {
    if (selectedStateId && newLabel.trim()) {
      renameState(selectedStateId, newLabel.trim());
      setRenameDialogOpen(false);
      setNewLabel('');
    }
  };

  const handleAddSymbol = () => {
    if (newSymbol.trim() && newSymbol.trim().length === 1) {
      addSymbol(newSymbol.trim());
      setNewSymbol('');
    }
  };

  const getTransitionsFrom = (stateId: string) => {
    return transitions.filter(t => t.from === stateId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Table2 className="w-4 h-4 text-violet-400" />
          States & Alphabet
        </h3>
      </div>

      <ScrollArea className="flex-1 px-4 py-2">
        {/* Alphabet section */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Alphabet
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {alphabet.map(sym => (
              <Badge
                key={sym}
                variant="secondary"
                className="px-2.5 py-1 text-xs font-mono gap-1.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => removeSymbol(sym)}
              >
                {sym}
                <X className="w-3 h-3" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
              placeholder="+ symbol"
              className="h-7 text-xs font-mono w-20"
              maxLength={1}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddSymbol}
              className="h-7 px-2"
              disabled={!newSymbol.trim()}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* States list */}
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          States ({states.length})
        </p>

        {states.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-xs">
            No states yet. Use the &quot;Add State&quot; tool or load an example.
          </div>
        )}

        <div className="space-y-1.5">
          {states.map(state => (
            <div
              key={state.id}
              className={cn(
                'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
                selectedStateId === state.id
                  ? 'bg-violet-500/10 border border-violet-500/30'
                  : 'hover:bg-accent border border-transparent'
              )}
              onClick={() => setSelectedState(state.id)}
            >
              {/* State visual indicator */}
              <div className="relative flex-shrink-0">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border-2',
                  selectedStateId === state.id
                    ? 'border-violet-400 bg-violet-500/10 text-violet-300'
                    : 'border-muted-foreground/40 text-muted-foreground'
                )}>
                  {state.label.charAt(0)}
                </div>
                {state.isFinal && (
                  <div className="absolute inset-0.5 rounded-full border-2 border-muted-foreground/40" />
                )}
              </div>

              {/* State info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-medium truncate">{state.label}</span>
                  {state.isStart && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      start
                    </Badge>
                  )}
                  {state.isFinal && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                      final
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {getTransitionsFrom(state.id).length} transition{getTransitionsFrom(state.id).length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-amber-500/10 hover:text-amber-400"
                  onClick={(e) => { e.stopPropagation(); toggleStartState(state.id); }}
                  title={state.isStart ? 'Remove start' : 'Set as start'}
                >
                  <Star className="w-3 h-3" fill={state.isStart ? 'currentColor' : 'none'} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-emerald-500/10 hover:text-emerald-400"
                  onClick={(e) => { e.stopPropagation(); toggleFinalState(state.id); }}
                  title={state.isFinal ? 'Remove final' : 'Set as final'}
                >
                  <CircleDot className="w-3 h-3" />
                </Button>
                <Dialog
                  open={renameDialogOpen && selectedStateId === state.id}
                  onOpenChange={(open) => {
                    setRenameDialogOpen(open);
                    if (open) setNewLabel(state.label);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-accent"
                      onClick={(e) => { e.stopPropagation(); setSelectedState(state.id); }}
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xs">
                    <DialogHeader>
                      <DialogTitle className="text-sm">Rename State</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        className="text-sm font-mono"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleRename} disabled={!newLabel.trim()}>
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); removeState(state.id); }}
                  title="Delete state"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Selected state details */}
        {selectedState && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Selected: {selectedState.label}
              </p>
              <div className="space-y-1">
                {alphabet.map(sym => {
                  const t = transitions.find(
                    tr => tr.from === selectedState.id && tr.symbol === sym
                  );
                  const targetState = t ? states.find(s => s.id === t.to) : null;
                  return (
                    <div key={sym} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-muted-foreground w-6 text-center">{sym}</span>
                      <span className="text-muted-foreground">→</span>
                      {targetState ? (
                        <span className="font-mono text-foreground">{targetState.label}</span>
                      ) : (
                        <span className="text-destructive/60 italic">undefined</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
