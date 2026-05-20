<template>
  <div class="layout">
    <div class="left-panel">
      <h1>CHIP-8 Upscaled Resolution Test</h1>

      <canvas
        ref="canvasRef"
        width="64"
        height="32"
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
    <div class="instructions-upload">
      <h2>Select file to execute</h2>

      <input type="file" accept=".ch8" @change="onRomSelected" />
    </div>
    <div class="right-panel">
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

const instructionsPerSecond = 100 // overall CPU instruction rate (typical CHIP-8 ~400-700)

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

  const draw = (now = performance.now()) => {
    try {
      const delta = now - lastTime
      lastTime = now

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
        }
      }

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
</style>