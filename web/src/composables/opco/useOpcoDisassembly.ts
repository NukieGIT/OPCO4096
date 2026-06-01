import { computed, ref } from 'vue'
import { useOpcoRom } from '@/composables/opco/useOpcoRom'

function getHighlightedRegisterIndex(instruction: number): number | null {
  const opcode = instruction & 0xF000
  const x = (instruction & 0x0F00) >> 8

  switch (opcode) {
    case 0x3000:
    case 0x4000:
    case 0x5000:
    case 0x6000:
    case 0x7000:
    case 0x8000:
    case 0x9000:
    case 0xC000:
    case 0xD000:
    case 0xE000:
    case 0xF000:
      return x
    default:
      return null
  }
}

export function useOpcoDisassembly() {
  const { rom, romSize, hasRom } = useOpcoRom()

  const currentRomIndex = ref(0)
  const currentRegisterIndex = ref<number | null>(null)

  const hexDump = computed(() =>
    Array.from(rom.value, (instruction) => instruction.toString(16).toUpperCase().padStart(4, '0')),
  )

  const currentInstruction = computed(() => rom.value[currentRomIndex.value] ?? 0)
  const currentInstructionHex = computed(() => currentInstruction.value.toString(16).toUpperCase().padStart(4, '0'))

  function getInstructionHex(index: number) {
    const instruction = rom.value[index]
    return typeof instruction === 'number' ? instruction.toString(16).toUpperCase().padStart(4, '0') : '0000'
  }

  function getRegisterHighlightForInstruction(index: number) {
    const instruction = rom.value[index]
    return typeof instruction === 'number' ? getHighlightedRegisterIndex(instruction) : null
  }

  function setCurrentRomIndex(index: number) {
    if (rom.value.length === 0) {
      currentRomIndex.value = 0
      currentRegisterIndex.value = null
      return
    }

    const clampedIndex = Math.max(0, Math.min(rom.value.length - 1, index))
    currentRomIndex.value = clampedIndex
    currentRegisterIndex.value = getRegisterHighlightForInstruction(clampedIndex)
  }

  function updateCurrentFromPc(pc: number) {
    if (rom.value.length === 0) {
      currentRomIndex.value = 0
      currentRegisterIndex.value = null
      return
    }

    const nextIndex = Math.max(0, Math.min(rom.value.length - 1, Math.floor((pc - 0x200) / 2)))
    setCurrentRomIndex(nextIndex)
  }

  return {
    rom,
    romSize,
    hasRom,
    hexDump,
    currentRomIndex,
    currentRegisterIndex,
    currentInstruction,
    currentInstructionHex,
    getInstructionHex,
    getRegisterHighlightForInstruction,
    getHighlightedRegisterIndex,
    setCurrentRomIndex,
    updateCurrentFromPc,
  }
}
