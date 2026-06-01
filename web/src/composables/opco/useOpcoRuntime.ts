import { ref } from 'vue'
import { opco } from '@/ts/wasm/OPCO4096'
import { ArrayReader, ArrayType } from '@/ts/wasm/memory/array'
import { useOpcoRom } from '@/composables/opco/useOpcoRom'

const romState = useOpcoRom()

const isRunning = ref(false)
const instructionsPerSecond = ref(500)
const soundActive = ref(false)

const pc = ref(0)
const currentRomIndex = ref(0)
const currentRegisterIndex = ref<number | null>(null)

const vRegisters = ref<number[]>(Array.from<number>({ length: 16 }).fill(0))
const stackRegisters = ref<number[]>(Array.from<number>({ length: 16 }).fill(0))
const stackPointer = ref(0)
const framebuffer = ref<Uint8Array>(new Uint8Array(64 * 32))

let reader: ArrayReader | null = null
let rafId = 0
let lastTime = 0
let instrAccumulator = 0
let timerAccumulator = 0

const TIMER_RATE_HZ = 60

function getReader() {
  if (!reader && opco?.memory) {
    reader = new ArrayReader(opco.memory)
  }
  return reader
}

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

function refreshPc() {
  if (typeof opco?.getPC !== 'function') return
  pc.value = opco.getPC()

  if (romState.rom.value.length === 0) {
    currentRomIndex.value = 0
    currentRegisterIndex.value = null
    return
  }

  const index = Math.max(
    0,
    Math.min(romState.rom.value.length - 1, Math.floor((pc.value - 0x200) / 2)),
  )
  currentRomIndex.value = index

  const instruction = romState.rom.value[index]
  currentRegisterIndex.value = instruction !== undefined ? getHighlightedRegisterIndex(instruction) : null
}

function refreshRegisters() {
  if (!opco?.memory) return

  if (typeof opco.getVRegistersPtr === 'function') {
    const vPtr = opco.getVRegistersPtr()
    const view = new Uint8Array(opco.memory.buffer, vPtr, 16)
    vRegisters.value = Array.from(view)
  }

  if (typeof opco.getStackPtr === 'function') {
    const stackPtrVal = opco.getStackPtr()
    const view = new Uint16Array(opco.memory.buffer, stackPtrVal, 16)
    stackRegisters.value = Array.from(view)
  }

  if (typeof opco.getStackPointer === 'function') {
    stackPointer.value = opco.getStackPointer()
  }
}

function refreshFramebuffer() {
  if (typeof opco?.getFramebuffer !== 'function') return
  const ar = getReader()
  if (!ar) return

  const fbPtr = opco.getFramebuffer()
  const fbData = ar.read(fbPtr)

  if (fbData.type === ArrayType.U8) {
    framebuffer.value = fbData.data
    return
  }

  framebuffer.value = new Uint8Array(
    fbData.data.buffer,
    fbData.data.byteOffset,
    fbData.data.byteLength,
  )
}

function refreshAll() {
  refreshPc()
  refreshRegisters()
  refreshFramebuffer()
}

function setInstructionsPerSecond(value: number) {
  const next = Number.isFinite(value) ? value : 0
  instructionsPerSecond.value = Math.max(1, Math.floor(next))
}

function tickTimers(deltaMs: number) {
  if (typeof opco?.updateCpuTimers !== 'function') return

  timerAccumulator += (TIMER_RATE_HZ * deltaMs) / 1000
  const timersToTick = Math.floor(timerAccumulator)
  if (timersToTick <= 0) return

  timerAccumulator -= timersToTick

  for (let i = 0; i < timersToTick; i += 1) {
    soundActive.value = opco.updateCpuTimers() > 0
  }
}

function tickCpu(deltaMs: number) {
  if (typeof opco?.tickCpu !== 'function') return

  instrAccumulator += (instructionsPerSecond.value * deltaMs) / 1000
  const toRun = Math.floor(instrAccumulator)
  if (toRun <= 0) return

  instrAccumulator -= toRun
  for (let i = 0; i < toRun; i += 1) {
    opco.tickCpu()
  }
}

function loop(now = performance.now()) {
  if (!isRunning.value) return

  const delta = now - lastTime
  lastTime = now

  tickCpu(delta)
  tickTimers(delta)
  refreshAll()

  rafId = requestAnimationFrame(loop)
}

function start() {
  if (isRunning.value) return
  if (typeof opco?.tickCpu !== 'function') return

  isRunning.value = true
  lastTime = performance.now()
  rafId = requestAnimationFrame(loop)
}

function pause() {
  if (!isRunning.value) return
  isRunning.value = false
  cancelAnimationFrame(rafId)
}

function step(count = 1) {
  if (typeof opco?.tickCpu !== 'function') return

  const steps = Math.max(1, Math.floor(count))
  for (let i = 0; i < steps; i += 1) {
    opco.tickCpu()
  }

  refreshAll()
}

export function useOpcoRuntime() {
  return {
    isRunning,
    instructionsPerSecond,
    soundActive,
    pc,
    currentRomIndex,
    currentRegisterIndex,
    vRegisters,
    stackRegisters,
    stackPointer,
    framebuffer,
    refreshPc,
    refreshRegisters,
    refreshFramebuffer,
    refreshAll,
    setInstructionsPerSecond,
    start,
    pause,
    step,
  }
}
