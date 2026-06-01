<template>

<div>
  <p>V Registers</p>
  <div class="register-grid">
    <div class="register-cell" v-for="(value, idx) in vRegisters" :key="`v-${idx}`" :class="{ active: idx === currentRegisterIndex }">
      <span class="register-label">V{{ idx.toString(16).toUpperCase().padStart(1, '0') }}</span>
      <span>{{ value.toString(16).toUpperCase().padStart(2, '0') }}</span>
    </div>
  </div>
  <p>Stack</p>
  <div class="stack-grid">
    <div class="stack-cell" v-for="(value, idx) in stackRegisters" :key="`s-${idx}`">
      <span class="stack-label">{{ idx }}</span>
      <span>{{ value.toString(16).toUpperCase().padStart(4, '0') }}</span>
    </div>
  </div>
</div>

</template>

<script setup lang="ts">
import { useOpcoRuntime } from '@/composables/opco/useOpcoRuntime';
import { useOpcoDisassembly } from '../composables/opco/useOpcoDisassembly'

const { vRegisters, stackRegisters } = useOpcoRuntime()
const { currentRegisterIndex } = useOpcoDisassembly()


</script>

<style scoped>

.register-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.register-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  background-color: #222;
  color: #0f0;
  font-family: monospace;
  border-radius: 4px;
}

.stack-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.stack-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  background-color: #222;
  color: #0f0;
  font-family: monospace;
  border-radius: 4px;
}

.register-label {
  color: #8cffb3;
  font-weight: 700;
}

.stack-label {
  color: #8cffb3;
  font-weight: 700;
}

.active {
  background-color: #0f0;
  color: #222;
  font-weight: bold;
}

</style>
