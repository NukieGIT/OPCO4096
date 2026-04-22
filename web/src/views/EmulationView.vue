<template>
  <h1>Emulation Page</h1>
  <p>{{ a }} + {{ b }} = {{ result }}</p>
  <input type="number" v-model="a" />
  <input type="number" v-model="b" />
</template>

<script setup lang="ts">
import { ArrayReader, ArrayType, ArrayWriter } from '@/ts/wasm/memory/array'
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

const strData = sw.write('Hello, WebAssembly!')
console.log(strData)
console.log(sr.read(strData))

const aw = new ArrayWriter(opco.memory, opco)
const ar = new ArrayReader(opco.memory)

const arrData = aw.write({ type: ArrayType.I32, data: new Int32Array([1, 2, 3]) })
console.log(arrData)
console.log(ar.read(arrData))

const fbPtr = opco.getFramebuffer(); 
const fbData = ar.read(fbPtr);

console.log(fbData);

</script>

<style scoped></style>
