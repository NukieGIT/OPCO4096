let audioContext: AudioContext | null = null
let oscillator: OscillatorNode | null = null
let gainNode: GainNode | null = null

function ensureAudio() {
  if (audioContext) return audioContext

  audioContext = new AudioContext()
  gainNode = audioContext.createGain()
  gainNode.gain.value = 0
  gainNode.connect(audioContext.destination)

  oscillator = audioContext.createOscillator()
  oscillator.type = 'square'
  oscillator.frequency.value = 880
  oscillator.connect(gainNode)
  oscillator.start()

  return audioContext
}

function playBeep() {
  const context = ensureAudio()
  if (!gainNode) return

  gainNode.gain.setTargetAtTime(0.12, context.currentTime, 0.01)
}

function stopBeep() {
  if (!gainNode || !audioContext) return
  gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.01)
}

function suspendAudio() {
  if (!audioContext) return
  audioContext.suspend()
}

function resumeAudio() {
  if (!audioContext) return
  audioContext.resume()
}

function destroyAudio() {
  oscillator?.stop()
  oscillator?.disconnect()
  gainNode?.disconnect()
  audioContext?.close()

  oscillator = null
  gainNode = null
  audioContext = null
}

export function useOpcoAudio() {
  return {
    ensureAudio,
    playBeep,
    stopBeep,
    suspendAudio,
    resumeAudio,
    destroyAudio,
  }
}
