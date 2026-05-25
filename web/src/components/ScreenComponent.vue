<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

import vertexShaderSource from '@/glsl/OpcoR8FrameBuffer.vert?raw'
import fragmentShaderSource from '@/glsl/OpcoR8FrameBuffer.frag?raw'
import chromaticAbberationFragmentShaderSource from '@/glsl/ChromaticAbberation.frag?raw'
import lensDistortionFragmentShaderSource from '@/glsl/LensDistortion.frag?raw'
import noiseFragmentShaderSource from '@/glsl/Noise.frag?raw'
import NoEffectFragmentShaderSource from '@/glsl/NoEffect.frag?raw'

import {
  calcScaleFactor,
  createProgram,
  createShader,
  initGL,
  resizeCanvasToDisplaySize,
} from '@/ts/webgl/util'
import { initialize as initializeOPCO, opco } from '@/ts/wasm/OPCO4096'
import { ArrayReader, ArrayType, ArrayWriter } from '@/ts/wasm/memory/array'

const COMPONENT_NAME = getCurrentInstance()?.type.__name ?? 'UnknownComponent'

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

interface Props {
  renderSettings?: {
    enableChromaticAbberation: boolean
    enableLensDistortion: boolean
    enableNoise: boolean
  }
}

const { renderSettings = { enableChromaticAbberation: true, enableLensDistortion: true, enableNoise: true } } = defineProps<Props>()

function intermediateFramebufferTextureFactory(paramSetter: (gl: WebGL2RenderingContext) => void) {
  return (gl: WebGL2RenderingContext, width: number, height: number, internalFormat: number) => {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.texStorage2D(gl.TEXTURE_2D, 1, internalFormat, width, height)
    paramSetter(gl)

    gl.bindTexture(gl.TEXTURE_2D, null)
    return texture
  }
}

const pixelArtTextureSetter = (gl: WebGL2RenderingContext) => {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}

const createFrameBufferTexture = intermediateFramebufferTextureFactory(pixelArtTextureSetter)

const lovelyhardcodedchip8ibmlogo = await fetch('logoibm.ch8').then((res) => res.arrayBuffer())
loadRomFromArrayBuffer(lovelyhardcodedchip8ibmlogo)

let rafId = 0
let cpuTicker: number | undefined = undefined

// Fullscreen quad and texture coordinates to draw opco framebuffer as texture to.
// vec4 for positions, vec2 for uv coordinates
// prettier-ignore
const vertexData = new Float32Array([
  -1, -1, 0, 1,  0, 0,
  1, -1, 0, 1,   1, 0,
  -1, 1, 0, 1,   0, 1,

  -1, 1, 0, 1,   0, 1,
  1, -1, 0, 1,   1, 0,
  1, 1, 0, 1,    1, 1,
])

onMounted(() => {
  if (!canvas.value) {
    console.error('Canvas element not found')
    return
  }
  const gl = initGL(canvas.value)

  const fullScreenVertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const opcoFbFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

  const chromaticAbberationFragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    chromaticAbberationFragmentShaderSource,
  )

  const lensDistortionFragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    lensDistortionFragmentShaderSource,
  )

  const noiseFragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    noiseFragmentShaderSource,
  )

  const noEffectFragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    NoEffectFragmentShaderSource,
  )

  const opcoFbprogram = createProgram(gl, fullScreenVertexShader, opcoFbFragmentShader)
  const chromaticAbberationProgram = createProgram(
    gl,
    fullScreenVertexShader,
    chromaticAbberationFragmentShader,
  )

  const lensDistortionProgram = createProgram(
    gl,
    fullScreenVertexShader,
    lensDistortionFragmentShader,
  )

  const noiseProgram = createProgram(gl, fullScreenVertexShader, noiseFragmentShader)

  const noEffectProgram = createProgram(
    gl,
    fullScreenVertexShader,
    noEffectFragmentShader,
  )

  resizeCanvasToDisplaySize(canvas.value)
  const { vpX, vpY, vpW, vpH } = calcScaleFactor(canvas.value.width, canvas.value.height, 64, 32)
  gl.viewport(vpX, vpY, vpW, vpH)

  const aPositionLoc = gl.getAttribLocation(opcoFbprogram, 'aPosition')
  const aTexCoordLoc = gl.getAttribLocation(opcoFbprogram, 'aTexCoord')
  const uTimeLoc = gl.getUniformLocation(chromaticAbberationProgram, 'uTime')

  // #region OPCO framebuffer Vao
  const opcoFbVao = gl.createVertexArray()
  gl.bindVertexArray(opcoFbVao)

  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW)
  gl.vertexAttribPointer(aPositionLoc, 4, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0)
  gl.vertexAttribPointer(
    aTexCoordLoc,
    2,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    4 * Float32Array.BYTES_PER_ELEMENT,
  )
  gl.enableVertexAttribArray(aPositionLoc)
  gl.enableVertexAttribArray(aTexCoordLoc)

  gl.bindVertexArray(null)
  // #endregion

  const opcoFbTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, opcoFbTexture)

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 64, 32, 0, gl.RED, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  gl.bindTexture(gl.TEXTURE_2D, null)

  let intermediateOpcoFbTexture = createFrameBufferTexture(gl, vpW, vpH, gl.RGBA8)
  let lensDistortionFbTexture = createFrameBufferTexture(gl, vpW, vpH, gl.RGBA8)
  let noiseFbTexture = createFrameBufferTexture(gl, vpW, vpH, gl.RGBA8)
  let chromaticAbberationFbTexture = createFrameBufferTexture(gl, vpW, vpH, gl.RGBA8)

  // #region chromatic abberation Vao
  const chromaticAbberationVao = gl.createVertexArray()
  gl.bindVertexArray(chromaticAbberationVao)

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW)
  gl.vertexAttribPointer(aPositionLoc, 4, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0)
  gl.vertexAttribPointer(
    aTexCoordLoc,
    2,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    4 * Float32Array.BYTES_PER_ELEMENT,
  )
  gl.enableVertexAttribArray(aPositionLoc)
  gl.enableVertexAttribArray(aTexCoordLoc)

  gl.bindVertexArray(null)
  // #endregion

  // #region lens distortion Vao
  const lensDistortionVao = gl.createVertexArray()
  gl.bindVertexArray(lensDistortionVao)

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW)
  gl.vertexAttribPointer(aPositionLoc, 4, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0)
  gl.vertexAttribPointer(
    aTexCoordLoc,
    2,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    4 * Float32Array.BYTES_PER_ELEMENT,
  )
  gl.enableVertexAttribArray(aPositionLoc)
  gl.enableVertexAttribArray(aTexCoordLoc)

  gl.bindVertexArray(null)
  // #endregion

  // #region noise Vao
  const noiseVao = gl.createVertexArray()
  gl.bindVertexArray(noiseVao)

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW)
  gl.vertexAttribPointer(aPositionLoc, 4, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0)
  gl.vertexAttribPointer(
    aTexCoordLoc,
    2,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    4 * Float32Array.BYTES_PER_ELEMENT,
  )
  gl.enableVertexAttribArray(aPositionLoc)
  gl.enableVertexAttribArray(aTexCoordLoc)

  gl.bindVertexArray(null)
  // #endregion

  // #region no effect Vao
  const noEffectVao = gl.createVertexArray()
  gl.bindVertexArray(noEffectVao)

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW)
  gl.vertexAttribPointer(aPositionLoc, 4, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0)
  gl.vertexAttribPointer(
    aTexCoordLoc,
    2,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    4 * Float32Array.BYTES_PER_ELEMENT,
  )
  gl.enableVertexAttribArray(aPositionLoc)
  gl.enableVertexAttribArray(aTexCoordLoc)

  gl.bindVertexArray(null)
  // #endregion

  // #region opco's framebuffer framebuffer setup
  const opcoFbFbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, opcoFbFbo)

  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    intermediateOpcoFbTexture,
    0,
  )

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  // #endregion

  // #region lens distortion framebuffer setup
  const lensDistortionFbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, lensDistortionFbo)

  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    lensDistortionFbTexture,
    0,
  )

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  // #endregion

  // #region noise framebuffer setup
  const noiseFbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, noiseFbo)

  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    noiseFbTexture,
    0,
  )

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  // #endregion

  // #region chromatic abberation framebuffer setup
  const chromaticAbberationFbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, chromaticAbberationFbo)

  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    chromaticAbberationFbTexture,
    0,
  )

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  // #endregion

  cpuTicker = setInterval(() => {
    opco.tickCpu()
    const fbData = ar.read(opcoFbPtr)
    if (fbData.type !== ArrayType.U8) {
      console.error(`[${COMPONENT_NAME}] Framebuffer data is not of type U8`)
      return
    }

    gl.bindVertexArray(opcoFbVao)
    gl.bindTexture(gl.TEXTURE_2D, opcoFbTexture)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 64, 32, gl.RED, gl.UNSIGNED_BYTE, fbData.data)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindVertexArray(null)
  }, 1000 / 100) // 100Hz

  let lastViewport = { vpW, vpH }
  const draw = () => {
    const resized = resizeCanvasToDisplaySize(canvas.value!)
    const { vpX, vpY, vpW, vpH } = calcScaleFactor(
      canvas.value!.width,
      canvas.value!.height,
      64,
      32,
    )
    if (resized) {
      gl.viewport(vpX, vpY, vpW, vpH)

      // Recreate framebuffer textures with new viewport size to avoid mismatched scaling issues.
      if (lastViewport.vpW !== vpW || lastViewport.vpH !== vpH) {
        lastViewport = { vpW, vpH }

        gl.deleteTexture(intermediateOpcoFbTexture)
        intermediateOpcoFbTexture = createFrameBufferTexture(gl, vpW, vpH, gl.RGBA8)

        gl.bindFramebuffer(gl.FRAMEBUFFER, opcoFbFbo)
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          intermediateOpcoFbTexture,
          0,
        )
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)


        gl.deleteTexture(lensDistortionFbTexture)
        lensDistortionFbTexture = createFrameBufferTexture(gl, vpW, vpH, gl.RGBA8)

        gl.bindFramebuffer(gl.FRAMEBUFFER, lensDistortionFbo)
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          lensDistortionFbTexture,
          0,
        )
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)


        gl.deleteTexture(noiseFbTexture)
        noiseFbTexture = createFrameBufferTexture(gl, vpW, vpH, gl.RGBA8)

        gl.bindFramebuffer(gl.FRAMEBUFFER, noiseFbo)
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          noiseFbTexture,
          0,
        )
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        gl.deleteTexture(chromaticAbberationFbTexture)
        chromaticAbberationFbTexture = createFrameBufferTexture(gl, vpW, vpH, gl.RGBA8)

        gl.bindFramebuffer(gl.FRAMEBUFFER, chromaticAbberationFbo)
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          chromaticAbberationFbTexture,
          0,
        )
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        console.log(
          `[${COMPONENT_NAME}] Resized canvas and recreated intermediate framebuffer texture.`,
        )
      }
    }

    if (Object.values(renderSettings).every((setting) => !setting)) {
      // If all post processing settings are disabled, render opco framebuffer directly to screen without any shader passes.
      gl.useProgram(opcoFbprogram)
      gl.bindVertexArray(opcoFbVao)
      gl.bindTexture(gl.TEXTURE_2D, opcoFbTexture)
      gl.viewport(vpX, vpY, vpW, vpH)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindVertexArray(null)

      rafId = requestAnimationFrame(draw)
      return
    }


    // OPCO framebuffer used as a texture
    gl.useProgram(opcoFbprogram)
    gl.bindVertexArray(opcoFbVao)
    gl.bindTexture(gl.TEXTURE_2D, opcoFbTexture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, opcoFbFbo)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.viewport(0, 0, vpW, vpH)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindVertexArray(null)

    // Start post-processing from the rendered framebuffer output.
    let lastTexture = intermediateOpcoFbTexture

    if (renderSettings.enableNoise) {
      // Noise shader pass
      gl.useProgram(noiseProgram)
      gl.bindVertexArray(noiseVao)
      gl.bindTexture(gl.TEXTURE_2D, lastTexture)
      gl.bindFramebuffer(gl.FRAMEBUFFER, noiseFbo)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.viewport(0, 0, vpW, vpH)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindVertexArray(null)

      lastTexture = noiseFbTexture
    }

    if (renderSettings.enableLensDistortion) {
      // Lens distortion shader pass
      gl.useProgram(lensDistortionProgram)
      gl.bindVertexArray(lensDistortionVao)
      gl.bindTexture(gl.TEXTURE_2D, lastTexture)
      gl.bindFramebuffer(gl.FRAMEBUFFER, lensDistortionFbo)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.viewport(0, 0, vpW, vpH)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindVertexArray(null)

      lastTexture = lensDistortionFbTexture
    }

    if (renderSettings.enableChromaticAbberation) {
      // Chromatic abberation shader pass
      gl.useProgram(chromaticAbberationProgram)
      gl.uniform1f(uTimeLoc, performance.now())
      gl.bindVertexArray(chromaticAbberationVao)
      gl.bindTexture(gl.TEXTURE_2D, lastTexture)
      gl.bindFramebuffer(gl.FRAMEBUFFER, chromaticAbberationFbo)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.viewport(0, 0, vpW, vpH)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindVertexArray(null)

      lastTexture = chromaticAbberationFbTexture
    }

    gl.useProgram(noEffectProgram)
    gl.bindVertexArray(noEffectVao)
    gl.bindTexture(gl.TEXTURE_2D, lastTexture)
    gl.viewport(vpX, vpY, vpW, vpH)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindVertexArray(null)

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
