<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

import simplePosAndUvsVertexShaderSource from '@/glsl/SimplePosAndUvs.vert?raw'
import bitSamplerFragmentShaderSource from '@/glsl/BitSampler.frag?raw'
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

/**
 * Pushes the CPU framebuffer data to the GPU.
 * @param fbArray The framebuffer data
 * @returns false when the WebGL context is not initialized.
 */
type UpdateFramebuffer = (fbArray: Uint8Array) => boolean

const updateFramebuffer = ref<UpdateFramebuffer>(() => false)

defineExpose({
  updateFramebuffer
})

const COMPONENT_NAME = getCurrentInstance()?.type.__name ?? 'UnknownComponent'

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

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


let rafId = 0

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

  const simplePosAndUvsVertexShader = createShader(gl, gl.VERTEX_SHADER, simplePosAndUvsVertexShaderSource)
  const bitSamplerFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, bitSamplerFragmentShaderSource)

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

  const opcoProgram = createProgram(gl, simplePosAndUvsVertexShader, bitSamplerFragmentShader)
  const chromaticAbberationProgram = createProgram(
    gl,
    simplePosAndUvsVertexShader,
    chromaticAbberationFragmentShader,
  )

  const lensDistortionProgram = createProgram(
    gl,
    simplePosAndUvsVertexShader,
    lensDistortionFragmentShader,
  )

  const noiseProgram = createProgram(gl, simplePosAndUvsVertexShader, noiseFragmentShader)

  const noEffectProgram = createProgram(
    gl,
    simplePosAndUvsVertexShader,
    noEffectFragmentShader,
  )

  resizeCanvasToDisplaySize(canvas.value)
  const { vpX, vpY, vpW, vpH } = calcScaleFactor(canvas.value.width, canvas.value.height, 64, 32)
  gl.viewport(vpX, vpY, vpW, vpH)

  const aPositionLoc = gl.getAttribLocation(opcoProgram, 'aPosition')
  const aTexCoordLoc = gl.getAttribLocation(opcoProgram, 'aTexCoord')
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

  updateFramebuffer.value = (fbArray) => {
    gl.bindVertexArray(opcoFbVao)
    gl.bindTexture(gl.TEXTURE_2D, opcoFbTexture)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 64, 32, gl.RED, gl.UNSIGNED_BYTE, fbArray)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindVertexArray(null)
    return true
  }

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
      gl.useProgram(opcoProgram)
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
    gl.useProgram(opcoProgram)
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
  updateFramebuffer.value = () => false
})
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
