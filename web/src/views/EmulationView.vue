<template>
  <h1>Emulation Page</h1>
  <p>{{ a }} + {{ b }} = {{ result }}</p>
  <input type="number" v-model="a" />
  <input type="number" v-model="b" />
</template>

<script setup lang="ts">
import { StringReader, StringWriter } from '@/ts/wasm/memory/string'
import { opco } from '@/ts/wasm/OPCO4096'
import { computed, ref } from 'vue'

const a = ref<number>(5)
const b = ref<number>(3)

const result = computed(() => {
  return a.value + b.value
})

const sw = new StringWriter(opco.memory, opco)
const sr = new StringReader(opco.memory)

const strData = sw.writeString('Hello, WebAssembly!')
console.log(strData)
console.log(sr.readString(strData))
</script>

<style scoped></style>
