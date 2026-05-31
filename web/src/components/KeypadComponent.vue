<template>
  <div class="keypad">
    <button v-for="(key, index) in keys" :key="key" class="keypad-key" @keydown="handleKeyDown(key, index)" @keyup="handleKeyUp(key, index)">{{ key }}</button>
  </div>
</template>

<script setup lang="ts">
import { opco } from '@/ts/wasm/OPCO4096';
import { ref } from 'vue'

const KEY_MAP: number[] = [
  0x1, 0x2, 0x3, 0xC,
  0x4, 0x5, 0x6, 0xD,
  0x7, 0x8, 0x9, 0xE,
  0xA, 0x0, 0xB, 0xF,
]

const keys = ref([
  '1', '2', '3', 'C',
  '4', '5', '6', 'D',
  '7', '8', '9', 'E',
  'A', '0', 'B', 'F',
])

function handleKeyDown(key: string, index: number) {
  const mappedKey = KEY_MAP[index];
  if (mappedKey === undefined) {
    console.warn('No mapping for key index', index);
    return;
  }
  opco.setKey(mappedKey, 1);
}

function handleKeyUp(key: string, index: number) {
  const mappedKey = KEY_MAP[index];
  if (mappedKey === undefined) {
    console.warn('No mapping for key index', index);
    return;
  }
  opco.setKey(mappedKey, 0);
}
</script>

<style scoped>

.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}

.keypad-key {
  margin: 5px;
  padding: 15px;
  font-size: 18px;
  color: #fff;
  background-color: #444;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.keypad-key:hover {
  background-color: #555;
}

.keypad-key:active {
  background-color: #666;
}


</style>
