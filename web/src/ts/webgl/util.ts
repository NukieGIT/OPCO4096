/**
 * Compiles a shader.
 *
 * @param gl WebGL2 context.
 * @param type `gl.VERTEX_SHADER` or `gl.FRAGMENT_SHADER`.
 * @param source GLSL source code for the shader.
 * @returns Compiled shader.
 * @throws Error if creation or compilation fails.
 */
export function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error('Failed to compile shader: ' + info)
  }

  return shader
}

/**
 * Links a program.
 *
 * @param gl WebGL2 context.
 * @param vertexShader Compiled vertex shader.
 * @param fragmentShader Compiled fragment shader.
 * @returns Linked program.
 * @throws Error if creation or linking fails.
 */
export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram {
  const program = gl.createProgram()
  if (!program) throw new Error('Failed to create program')

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error('Failed to link program: ' + info)
  }

  return program
}

/**
 * Initializes WebGL2 context.
 *
 * @param canvasEl Canvas element to get context from.
 * @returns Initialized WebGL2 context.
 * @throws Error if WebGL2 is not supported.
 */
export function initGL(canvasEl: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvasEl.getContext('webgl2')
  if (!gl) throw new Error('WebGL2 not supported')
  gl.clear(gl.COLOR_BUFFER_BIT)
  return gl
}

/**
 * Syncs `canvas.width/height` (buffer pixels) to `clientWidth/clientHeight * devicePixelRatio` (CSS px).
 * Call before `gl.viewport(...)` / resolution uniforms.
 *
 * @param canvas Target canvas.
 * @returns a boolean indicating whether the canvas was resized.
 */
export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean {
  const cssWidth = canvas.clientWidth
  const cssHeight = canvas.clientHeight
  if (cssWidth <= 0 || cssHeight <= 0) return false

  const dpr = window.devicePixelRatio || 1
  const displayWidth = Math.max(1, Math.round(cssWidth * dpr))
  const displayHeight = Math.max(1, Math.round(cssHeight * dpr))

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth
    canvas.height = displayHeight
    return true
  }
  return false
}

/**
 * Centered, integer-scaled viewport, to avoid artifacts caused by non-integer scaling.
 * Picks the largest whole-number scale that fits (clamped to min `1`).
 *
 * @param canvasWidth Canvas pixel width (`canvas.width`).
 * @param canvasHeight Canvas pixel height (`canvas.height`).
 * @param width Unscaled content width in pixels (e.g. your framebuffer/texture width).
 * @param height Unscaled content height in pixels (e.g. your framebuffer/texture height).
 * @returns Viewport rectangle in pixels: `{ vpX, vpY, vpW, vpH }` (pass to `gl.viewport`).
 */
export function calcScaleFactor(
  canvasWidth: number,
  canvasHeight: number,
  width: number,
  height: number,
) {
  const scale = Math.max(1, Math.floor(Math.min(canvasWidth / width, canvasHeight / height)))

  const vpW = width * scale
  const vpH = height * scale
  const vpX = Math.floor((canvasWidth - vpW) / 2)
  const vpY = Math.floor((canvasHeight - vpH) / 2)

  return { vpX, vpY, vpW, vpH }
}
