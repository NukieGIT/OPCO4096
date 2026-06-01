import { useOpcoRuntime } from '@/composables/opco/useOpcoRuntime'

export function useOpcoRegisters() {
  const runtime = useOpcoRuntime()

  return {
    pc: runtime.pc,
    currentRomIndex: runtime.currentRomIndex,
    currentRegisterIndex: runtime.currentRegisterIndex,
    vRegisters: runtime.vRegisters,
    stackRegisters: runtime.stackRegisters,
    stackPointer: runtime.stackPointer,
    refreshRegisters: runtime.refreshRegisters,
  }
}
