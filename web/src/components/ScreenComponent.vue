<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

import vertexShaderSource from '@/glsl/OpcoR8FrameBuffer.vert?raw'
import fragmentShaderSource from '@/glsl/OpcoR8FrameBuffer.frag?raw'
import { createProgram, createShader, initGL, resizeCanvasToDisplaySize } from '@/ts/webgl/util'
import { initialize as initializeOPCO, opco } from '@/ts/wasm/OPCO4096'
import { ArrayReader, ArrayType, ArrayWriter } from '@/ts/wasm/memory/array'

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

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

await initializeOPCO()
const aw = new ArrayWriter(opco.memory, opco)
const ar = new ArrayReader(opco.memory)

const opcoFbPtr = opco.getFramebuffer()

const lovelyhardcodedchip8ibmlogo = await fetch('logoibm.ch8').then(res => res.arrayBuffer())
loadRomFromArrayBuffer(lovelyhardcodedchip8ibmlogo)

let rafId = 0
let cpuTicker: number | undefined = undefined

// Fullscreen quad to draw opco framebuffer as texture to.
// prettier-ignore
const vertexData = new Float32Array([
  -1, -1, 0,
  1, -1, 0,
  -1, 1, 0,

  -1, 1, 0,
  1, -1, 0,
  1, 1, 0
])

// Fullscreen quad texture coordinates.
// prettier-ignore
const texCoordData = new Float32Array([
  0, 1,
  1, 1,
  0, 0,

  0, 0,
  1, 1,
  1, 0
])

onMounted(() => {
  if (!canvas.value) {
    console.error('Canvas element not found')
    return
  }
  const gl = initGL(canvas.value)

  const fullScreenVertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const opcoFbFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  const opcoFbprogram = createProgram(gl, fullScreenVertexShader, opcoFbFragmentShader)

  resizeCanvasToDisplaySize(canvas.value)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  gl.useProgram(opcoFbprogram)

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  const opcoFbTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, opcoFbTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 64, 32, 0, gl.RED, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)




  cpuTicker = setInterval(() => {
    opco.tickCpu()
    const fbData = ar.read(opcoFbPtr)
    if (fbData.type !== ArrayType.U8) {
      console.error('Framebuffer data is not of type U8')
      return
    }

    gl.bindTexture(gl.TEXTURE_2D, opcoFbTexture)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 64, 32, gl.RED, gl.UNSIGNED_BYTE, fbData.data)

  }, 1000 / 100) // 100Hz

  const aPositionLoc = gl.getAttribLocation(opcoFbprogram, 'aPosition')
  const aTexCoordLoc = gl.getAttribLocation(opcoFbprogram, 'aTexCoord')

  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW)
  gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(aPositionLoc)

  const texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, texCoordData, gl.STATIC_DRAW)
  gl.vertexAttribPointer(aTexCoordLoc, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(aTexCoordLoc)

  const draw = () => {

    resizeCanvasToDisplaySize(canvas.value!)

    // Calculates and forces a scale factor of 64x32 framebuffer to avoid triangle seam artifacts.
    const scale = Math.max(1, Math.floor(Math.min(gl.canvas.width / 64, gl.canvas.height / 32)))

    const vpW = 64 * scale
    const vpH = 32 * scale
    const vpX = Math.floor((gl.canvas.width - vpW) / 2)
    const vpY = Math.floor((gl.canvas.height - vpH) / 2)

    gl.viewport(vpX, vpY, vpW, vpH)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    rafId = requestAnimationFrame(draw)
  }
  draw()
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  clearInterval(cpuTicker)
})
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
