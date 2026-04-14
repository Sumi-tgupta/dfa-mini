'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useDFAStore } from '@/lib/dfa/store';
import { validateDFA, testString as testStringAlgo } from '@/lib/dfa/algorithms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Keyboard,
  SkipForward,
  SkipBack,
  Pause,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StringTester() {
  const {
    states, transitions, alphabet,
    testString, testResult, currentTestStep, isTesting,
    setTestString, setCurrentTestStep, setIsTesting,
    showMinimized, minimizationResult,
  } = useDFAStore();

  const [errors, setErrors] = useState<string[]>([]);
  // BUG FIX: slider was inverted — slider value IS the delay in ms (lower = faster)
  const [animDelay, setAnimDelay] = useState(600);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dfaStates = showMinimized && minimizationResult?.minimizedDFA
    ? minimizationResult.minimizedDFA.states : states;
  const dfaTransitions = showMinimized && minimizationResult?.minimizedDFA
    ? minimizationResult.minimizedDFA.transitions : transitions;

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
    setIsTesting(false);
  }, [setIsTesting]);

  const handleRun = () => {
    const dfa = { states: dfaStates, transitions: dfaTransitions, alphabet };
    const validationErrors = validateDFA(dfa);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    const result = testStringAlgo(dfa, testString);

    // BUG FIX: store the result FIRST so canvas can read steps during animation
    useDFAStore.setState({ testResult: result, currentTestStep: 0, isTesting: true });
    setIsTesting(true);

    let step = 0;
    animRef.current = setInterval(() => {
      step++;
      if (step <= result.steps.length - 1) {
        setCurrentTestStep(step);
      } else {
        stopAnimation();
        setCurrentTestStep(result.steps.length - 1);
      }
    }, animDelay);
  };

  const handlePause = () => {
    stopAnimation();
  };

  const handleStepForward = () => {
    if (!testResult) return;
    setCurrentTestStep(Math.min(currentTestStep + 1, testResult.steps.length - 1));
  };

  const handleStepBack = () => {
    if (!testResult) return;
    setCurrentTestStep(Math.max(currentTestStep - 1, 0));
  };

  const handleReset = () => {
    stopAnimation();
    setTestString('');
    useDFAStore.setState({ testResult: null, currentTestStep: 0, isTesting: false });
    setErrors([]);
  };

  const handleSkipToEnd = () => {
    if (!testResult) return;
    stopAnimation();
    setCurrentTestStep(testResult.steps.length - 1);
  };

  const handleSkipToStart = () => {
    if (!testResult) return;
    stopAnimation();
    setCurrentTestStep(0);
  };

  const quickStrings = ['', '0', '1', '01', '10', '0011', '0101', '000', '111', '01010'];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-emerald-400" />
          String Tester
        </h3>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Input row */}
        <div className="flex gap-2">
          <Input
            value={testString}
            onChange={(e) => {
              setTestString(e.target.value);
              setErrors([]);
            }}
            onKeyDown={(e) => e.key === 'Enter' && !isTesting && handleRun()}
            placeholder="Enter input string…"
            className="font-mono text-sm"
            disabled={isTesting}
          />
          {isTesting ? (
            <Button
              size="sm"
              onClick={handlePause}
              className="gap-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Pause className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleRun}
              disabled={states.length === 0}
              className="gap-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Run</span>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleReset} className="px-2">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Speed slider — BUG FIX: value IS the delay directly, no inversion needed */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">Speed</span>
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">Fast</span>
          <input
            type="range"
            min={100}
            max={1200}
            step={100}
            value={1300 - animDelay}          // slider right = faster = lower delay
            onChange={(e) => setAnimDelay(1300 - Number(e.target.value))}
            className="flex-1 h-1 accent-violet-500"
          />
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">Slow</span>
        </div>

        {/* Quick strings */}
        <div className="flex flex-wrap gap-1.5">
          {quickStrings.map((str, i) => (
            <Badge
              key={i}
              variant="outline"
              className="px-2 py-0.5 text-[10px] font-mono cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                stopAnimation();
                setTestString(str);
                useDFAStore.setState({ testResult: null, currentTestStep: 0 });
                setErrors([]);
              }}
            >
              {str === '' ? 'ε' : `"${str}"`}
            </Badge>
          ))}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="px-4 pb-2">
          <div className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">{err}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {testResult && (
        <ScrollArea className="flex-1 px-4 pb-3">
          {/* Result banner */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg mb-3',
            testResult.accepted
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          )}>
            {testResult.accepted ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-xs font-medium text-emerald-400">Accepted</span></>
            ) : (
              <><XCircle className="w-4 h-4 text-red-400" /><span className="text-xs font-medium text-red-400">Rejected</span></>
            )}
            <span className="text-xs text-muted-foreground ml-auto font-mono">
              {testString === '' ? 'ε' : `"${testString}"`} &nbsp;·&nbsp; {testResult.steps.length} step{testResult.steps.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Step navigation */}
          <div className="flex items-center justify-center gap-1 mb-3">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSkipToStart} disabled={isTesting}>
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleStepBack} disabled={currentTestStep === 0 || isTesting}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-mono text-muted-foreground w-16 text-center">
              {currentTestStep + 1}/{testResult.steps.length}
            </span>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleStepForward} disabled={currentTestStep >= testResult.steps.length - 1 || isTesting}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSkipToEnd} disabled={isTesting}>
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Step list */}
          <div className="space-y-1">
            {testResult.steps.map((step, i) => {
              const stateObj = dfaStates.find(s => s.id === step.state);
              const isCurrent = i === currentTestStep;
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all',
                    isCurrent
                      ? step.isAccepted
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-violet-500/10 border border-violet-500/20'
                      : i < currentTestStep
                      ? 'opacity-50'
                      : 'opacity-25'
                  )}
                  onClick={() => { stopAnimation(); setCurrentTestStep(i); }}
                >
                  <span className="w-5 text-muted-foreground text-[10px] shrink-0">{i + 1}</span>
                  <span className="font-semibold shrink-0">{stateObj?.label ?? step.state}</span>
                  <span className="text-muted-foreground shrink-0">│</span>
                  <span className="text-muted-foreground truncate">
                    <span className="text-foreground">{step.consumed || 'ε'}</span>
                    <span className="text-muted-foreground">↑</span>
                    <span className="text-foreground">{step.remaining || 'ε'}</span>
                  </span>
                  {isCurrent && step.isCurrent && (
                    <span className="ml-auto shrink-0">
                      {step.isAccepted
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {!testResult && !errors.length && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center text-muted-foreground">
            <Keyboard className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Enter a string and click Run</p>
            <p className="text-[10px] mt-1 opacity-60">Every state needs transitions for all alphabet symbols</p>
          </div>
        </div>
      )}
    </div>
  );
}
