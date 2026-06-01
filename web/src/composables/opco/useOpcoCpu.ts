import { useOpcoRuntime } from '@/composables/opco/useOpcoRuntime'

export function useOpcoCpu() {
  const runtime = useOpcoRuntime()

  return {
    isRunning: runtime.isRunning,
    instructionsPerSecond: runtime.instructionsPerSecond,
    soundActive: runtime.soundActive,
    setInstructionsPerSecond: runtime.setInstructionsPerSecond,
    start: runtime.start,
    pause: runtime.pause,
    step: runtime.step,
    refreshAll: runtime.refreshAll,
  }
}
