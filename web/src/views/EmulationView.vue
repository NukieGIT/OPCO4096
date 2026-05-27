<template>
  <div class="layout">
    <div class="left-panel">
      <h1>CHIP-8 Upscaled Resolution Test</h1>

      <canvas
        ref="canvasRef"
        width="64"
        height="32"
        class="crt-border"
        style="
          width:640px;
          height:320px;
          border:1px solid white;
          background:black;
          image-rendering: pixelated;
        "
      ></canvas>

      <div class="controls-panel">
        <button 
          :class="['start-btn', { 'running': isRunning }]" 
          :disabled="rom.length === 0 || isRunning" 
          @click="startRender"
        >
          {{ isRunning ? 'Running...' : 'Start Execution' }}
        </button>
      </div>
    </div>
    <div class="instructions-upload crt-border">
      <h2>Select file to execute</h2>

      <input type="file" accept=".ch8" @change="onRomSelected" />
    </div>
    <div class="right-panel crt-border">
      <div class="panel-section">
        <h2>ROM Hex Dump</h2>

        <div class="hex-grid">
          <span
            v-for="(value, index) in hexDump"
            :key="index"
            :class="['hex-cell', { active: index === currentRomIndex } ]"
          >
            {{ value }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div class="registers-stack-panel crt-border">
    <div class="panel-section">
      <h2>V Registers</h2>
      <div class="register-grid">
        <div
          class="register-cell"
          v-for="(value, idx) in vRegisters"
          :key="`v-${idx}`"
          :class="{ active: idx === currentRegisterIndex }"
        >
          <span class="register-label">V{{ idx.toString(16).toUpperCase().padStart(1, '0') }}</span>
          <span>{{ value.toString(16).toUpperCase().padStart(2, '0') }}</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h2>Stack</h2>
      <div class="stack-grid">
        <div class="stack-cell" v-for="(value, idx) in stackRegisters" :key="`s-${idx}`">
          <span class="stack-label">{{ idx }}</span>
          <span>{{ value.toString(16).toUpperCase().padStart(4, '0') }}</span>
        </div>
      </div>
      <div class="stack-meta">SP: {{ stackPointer }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { initialize, opco } from '@/ts/wasm/OPCO4096'
import { ArrayReader, ArrayType, ArrayWriter } from '@/ts/wasm/memory/array'

initialize()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const WIDTH = 64
const HEIGHT = 32
const BYTES_PER_PIXEL = 4; // RGBA
const COLOR_WHITE = 255;

const aw = new ArrayWriter(opco.memory, opco)
const ar = new ArrayReader(opco.memory)

const onRomSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const arrayBuffer = await file.arrayBuffer()
  loadRomFromArrayBuffer(arrayBuffer)
}

const rom = ref<Uint16Array>(new Uint16Array())
const vRegisters = ref<number[]>(new Array(16).fill(0))
const stackRegisters = ref<number[]>(new Array(16).fill(0))
const stackPointer = ref(0)

const loadRomFromArrayBuffer = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  const opcodes = new Uint16Array(bytes.length / 2)

  for (let i = 0; i < opcodes.length; i++) {
    const highByte = bytes[i * 2] ?? 0
    const lowByte = bytes[i * 2 + 1] ?? 0
    
    opcodes[i] = (highByte << 8) | lowByte
  }
  
  rom.value = opcodes
  
  const romData = aw.write({ type: ArrayType.U16, data: opcodes })
  const romReader = ar.readStruct(romData)

  opco.initializeCpu(romReader.ptr, romReader.len)
}

const currentRomIndex = ref(0)
const currentRegisterIndex = ref<number | null>(null)

let audioContext: AudioContext | null = null
let oscillator: OscillatorNode | null = null
let gainNode: GainNode | null = null

const initAudio = () => {
  if (audioContext) return

  audioContext = new (window.AudioContext ?? (window as any).webkitAudioContext)()
  gainNode = audioContext.createGain()
  gainNode.gain.value = 0
  gainNode.connect(audioContext.destination)

  oscillator = audioContext.createOscillator()
  oscillator.type = 'square'
  oscillator.frequency.value = 880
  oscillator.connect(gainNode)
  oscillator.start()
}

const playBeep = () => {
  if (!audioContext) initAudio()
  if (!gainNode || !audioContext) return
  gainNode.gain.setTargetAtTime(0.12, audioContext.currentTime, 0.01)
}

const stopBeep = () => {
  if (!gainNode || !audioContext) return
  gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.01)
}

// Standard stable instructions rate for comfortable gameplay (e.g., Space Invaders, Pong)
const instructionsPerSecond = 500 

const getHighlightedRegisterIndex = (instruction: number): number | null => {
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

const hexDump = computed(() => {
  const values: string[] = []

  for (let i = 0; i < rom.value.length; i++) {
    const item = rom.value[i]
    if (typeof item === 'number') {
      values.push(item.toString(16).toUpperCase().padStart(BYTES_PER_PIXEL, '0'))
    } else {
      values.push('0000')
    }
  }

  return values
})

let frameId: number
const isRunning = ref(false)

function startRender() {
  if (isRunning.value) return 

  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  isRunning.value = true

  const image = ctx.createImageData(WIDTH, HEIGHT)
  const pixels = image.data

  let lastTime = performance.now()
  let instrAccumulator = 0
  
  // Timer Accumulator tracks 60Hz milestones (exactly 1 tick every 16.67ms)
  let timerAccumulator = 0
  const TIMER_RATE_HZ = 60

  const draw = (now = performance.now()) => {
    try {
      const delta = now - lastTime
      lastTime = now

      // 1. Process CPU Instruction Cycles
      instrAccumulator += (instructionsPerSecond * delta) / 1000
      const toRun = Math.floor(instrAccumulator)
      if (toRun > 0) {
        instrAccumulator -= toRun
        for (let i = 0; i < toRun; i++) {
          opco.tickCpu()
        }
        if (typeof opco.getPC === 'function') {
          const pc = opco.getPC()
          currentRomIndex.value = Math.max(0, Math.min(rom.value.length - 1, Math.floor((pc - 0x200) / 2)))
          const currentInstruction = rom.value[currentRomIndex.value]
          currentRegisterIndex.value = currentInstruction !== undefined ? getHighlightedRegisterIndex(currentInstruction) : null
        }
      }

      // 2. Process Hardware Timers (Strictly 60Hz)
      timerAccumulator += (TIMER_RATE_HZ * delta) / 1000
      const timersToTick = Math.floor(timerAccumulator)
      if (timersToTick > 0) {
        timerAccumulator -= timersToTick
        for (let i = 0; i < timersToTick; i++) {
          if (typeof opco.updateCpuTimers === 'function') {
            const soundActive = opco.updateCpuTimers()
            if (soundActive > 0) {
              playBeep()
            } else {
              stopBeep()
            }
          }
        }
      }

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

      // 3. Process Graphic Frame Buffers
      const fbPtr = opco.getFramebuffer()
      const fbData = ar.read(fbPtr)

      for (let i = 0; i < WIDTH * HEIGHT; i++) {
        const on = fbData.data[i] === 1
        const p = i * 4

        const c = on ? COLOR_WHITE : 0

        pixels[p] = c
        pixels[p + 1] = c
        pixels[p + 2] = c
        pixels[p + 3] = COLOR_WHITE
      }

      ctx.putImageData(image, 0, 0)

    } catch (error) {
      console.error('Error rendering frame:', error)
      isRunning.value = false
      return
    }

    frameId = requestAnimationFrame(draw)
  }

  draw()
}

onUnmounted(() => cancelAnimationFrame(frameId))
</script>

<style scoped>
.layout {
  margin: 10px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.left-panel {
  flex: 1;
}

.controls-panel {
  margin-top: 12px;
}

.start-btn {
  background: #00ff88;
  color: #08120c;
  border: none;
  padding: 10px 24px;
  font-family: monospace;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  text-shadow: none !important;
  animation: none !important;
  letter-spacing: normal;
}

.start-btn:hover:not(:disabled) {
  background: #00dd77;
}

.start-btn:disabled {
  background: #9c0000;
  color: #221405;
  cursor: not-allowed;
  border: none;
}

.start-btn.running:disabled {
  background: #ff9f43;
  color: #221405;
}

.instructions-upload {
  display: flex;
  padding: 10px;
  flex-direction: column;
  justify-content: center;
  border: 1px #fff solid;
}

.right-panel {
  width: 320px;
  border: 1px solid white;
  padding: 12px;
  background: #111;
  max-height: 500px;
  overflow-y: auto;
}

.registers-stack-panel {
  width: 100%;
  border: 1px solid white;
  padding: 12px;
  background: #111;
  margin-top: 20px;
}

.panel-section {
  margin-bottom: 20px;
}

h1,
h2 {
  color: white;
  margin-bottom: 10px;
}

.hex-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.hex-cell {
  color: #00ff88;
  font-family: monospace;
  font-size: 14px;
  padding: 4px;
  background: #1b1b1b;
  text-align: center;
  border-radius: 4px;
}

.hex-cell.active {
  background: #00ff88;
  color: #08120c;
  font-weight: 700;
}

.register-cell.active {
  background: #ff9f43;
  color: #08120c;
  font-weight: 700;
}

.registers-panel {
  margin-top: 24px;
}

.register-grid,
.stack-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.register-cell,
.stack-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  background: #161616;
  color: #00ff88;
  font-family: monospace;
}

.register-label,
.stack-label {
  color: #8cffb3;
  font-weight: 700;
}

.stack-meta {
  margin-top: 12px;
  color: #ffffff;
  font-size: 14px;
}
</style>