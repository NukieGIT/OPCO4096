<template>

<div class="hex-dump">
  <span
    v-for="(value, index) in hexDump"
    :key="index"
    :class="['hex-cell', { active: index === currentRomIndex } ]"
  >
    {{ value }}
  </span>
</div>

</template>

<script setup lang="ts">
import { useOpcoRuntime } from '@/composables/opco/useOpcoRuntime';
import { useOpcoDisassembly } from '../composables/opco/useOpcoDisassembly'

const { hexDump } = useOpcoDisassembly()
const { currentRomIndex } = useOpcoRuntime()

</script>

<style scoped>

.hex-dump {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.hex-cell {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #222;
  color: #0f0;
  font-family: monospace;
  border-radius: 4px;
  padding: 4px;
}

.active {
  background-color: #0f0;
  color: #222;
  font-weight: bold;
}

*:not(.active) {
  transition: background-color 0.2s, color 0.2s;
}

</style>
