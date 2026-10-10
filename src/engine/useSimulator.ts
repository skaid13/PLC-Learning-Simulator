import { useEffect, useReducer, useState } from 'react';
import type { ProgramWorkspace } from '../types';
import { createRuntime, runtimeReducer, SCAN_INTERVAL_MS } from './runtime';

/** 调用方在修改程序/切换实验的同一事件中 reset(nextProgram)，避免混用轨迹。 */
export function useSimulator(program: ProgramWorkspace) {
  const [speed, setSpeed] = useState(1);
  const [state, dispatch] = useReducer(runtimeReducer, program, createRuntime);
  useEffect(() => {
    if (state.status !== 'running') return;
    const timer = window.setInterval(
      () => dispatch({ type: 'tick', program }),
      SCAN_INTERVAL_MS / speed,
    );
    return () => window.clearInterval(timer);
  }, [program, state.status, speed]);
  return {
    state,
    speed,
    setSpeed,
    setSetting: (name: 'autoSensors' | 'stalled' | 'stuckSensors', value: boolean) =>
      dispatch({ type: 'setting', program, name, value }),
    start: () => dispatch({ type: 'start', program }),
    stop: () => dispatch({ type: 'stop', program }),
    step: () => dispatch({ type: 'step', program }),
    reset: (nextProgram = program) => dispatch({ type: 'reset', program: nextProgram }),
    setInput: (variableId: string, value: boolean) =>
      dispatch({ type: 'input', program, variableId, value }),
  };
}
export type Simulator = ReturnType<typeof useSimulator>;
