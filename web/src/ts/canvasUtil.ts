/**
 * Syncs `canvas.width/height` (buffer pixels) to `clientWidth/clientHeight * devicePixelRatio` (CSS px).
 * Call before `gl.viewport(...)` / resolution uniforms.
 *
 * @param canvas Target canvas.
 */
export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const cssWidth = canvas.clientWidth
  const cssHeight = canvas.clientHeight
  if (cssWidth <= 0 || cssHeight <= 0) return

  const dpr = window.devicePixelRatio || 1
  const displayWidth = Math.max(1, Math.round(cssWidth * dpr))
  const displayHeight = Math.max(1, Math.round(cssHeight * dpr))

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth
    canvas.height = displayHeight
  }
}
