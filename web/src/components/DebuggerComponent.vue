<template>

<label>
  Rom:
  <input type="file" accept=".ch8" @change="onRomSelected" />
</label>
<div class="controls">
  <button @click="startRom">Start Rom</button>
  <button @abort="pauseRom">Pause Rom</button>
  <button @click="reloadRom">Reload Rom</button>
  <button @click="ejectRom">Eject Rom</button>
</div>
  <p>Debugger</p>
  <div class="controls">
    <button @click="step(1)">Step One</button>
    <button @click="step(stepCount)">Step {{ stepCount }}</button>
  </div>
  <label>
    Step Count:
    <input type="number" placeholder="Step Count" v-model="stepCount" />
  </label>
  <label>
    Instructions per second:
    <input type="number" placeholder="Instructions per second" v-model="instructionsPerSecond" />
  </label>

</template>

<script setup lang="ts">
import { useOpcoCpu } from '@/composables/opco/useOpcoCpu'
import { useOpcoRom } from '@/composables/opco/useOpcoRom'
import { ref, watch } from 'vue'

const stepCount = ref(10)
const instructionsPerSecond = ref(700)
const lastRomBuffer = ref<ArrayBuffer | null>(null)

const { loadRomFromFile, loadRomFromArrayBuffer, ejectRom: ejectLoadedRom } = useOpcoRom()
const { start, pause, step: stepCpu, setInstructionsPerSecond, refreshAll } = useOpcoCpu()

watch(instructionsPerSecond, (value) => setInstructionsPerSecond(value), { immediate: true })

const onRomSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const buffer = await loadRomFromFile(file)
  lastRomBuffer.value = buffer
  refreshAll()
}

function startRom() {
  start()
}

function pauseRom() {
  pause()
}

function reloadRom() {
  if (!lastRomBuffer.value) return
  loadRomFromArrayBuffer(lastRomBuffer.value)
  refreshAll()
}

function ejectRom() {
  lastRomBuffer.value = null
  ejectLoadedRom()
  refreshAll()
}

function step(count: number) {
  pause()
  stepCpu(count)
}

</script>

<style scoped>

.controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

input[type="file"] {
  width: 100%;
}

</style>
