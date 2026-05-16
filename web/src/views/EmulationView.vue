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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { initialize, opco } from '@/ts/wasm/OPCO4096'
import { ArrayReader, ArrayType, ArrayWriter } from '@/ts/wasm/memory/array'

initialize()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const WIDTH = 64
const HEIGHT = 32
const BYTES_PER_PIXEL = 4; // RGBA
const COLOR_WHITE = 255;

const instructions = [
  0x00E0,
  0x6002,
  0x6102,
  0xA032,
  0xD015,

  0x600A,
  0x610A,
  0xA037,
  0xD015,

  0x6012,
  0x6112,
  0xA03C,
  0xD015,

  0x1200
]

const aw = new ArrayWriter(opco.memory, opco)
const ar = new ArrayReader(opco.memory)

const rom = new Uint16Array(instructions)

const romData = aw.write({type: ArrayType.U16, data: rom})
const romReader = ar.readStruct(romData)

opco.initializeCpu(romReader.ptr, romReader.len)

const currentRomIndex = ref(0)

const instructionsPerSecond = 100 // overall CPU instruction rate (typical CHIP-8 ~400-700)

const hexDump = computed(() => {
  const values: string[] = []

  for (let i = 0; i < rom.length; i++) {
    const item = rom[i]
    if (typeof item === 'number') {
      values.push(item.toString(16).toUpperCase().padStart(BYTES_PER_PIXEL, '0'))
    } else {
      values.push('0000')
    }
  }

  return values
})

let frameId: number

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

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
          currentRomIndex.value = Math.max(0, Math.min(rom.length - 1, Math.floor((pc - 0x200) / 2)))
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
      return
    }

    frameId = requestAnimationFrame(draw)
  }

  draw()
})

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
