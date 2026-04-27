<template>
  <h1>Emulation Page</h1>
  <p>{{ a }} + {{ b }} = {{ result }}</p>
  <input type="number" v-model="a" />
  <input type="number" v-model="b" />
</template>

<script setup lang="ts">
import { ArrayReader, ArrayType, ArrayWriter } from '@/ts/wasm/memory/array'
import { StringReader, StringWriter } from '@/ts/wasm/memory/string'
import { initialize, opco } from '@/ts/wasm/OPCO4096'
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

    var instructions = [
        // Address 0x200
        0x6002, // LD V0, 2     (Set X coordinate for 'A')
        0x6102, // LD V1, 2     (Set Y coordinate for 'A')
        0xA032, // LD I, 0x032  (Point to 'A' in the font set)
        0xD015, // DRW V0, V1, 5 (Draw 'A')
        0x600A, // LD V0, 10    (Set X coordinate for 'B')
        0x610A, // LD V1, 10    (Set Y coordinate for 'B')
        0xA037, // LD I, 0x037  (Point to 'B' in the font set)
        0xD015, // DRW V0, V1, 5 (Draw 'B')i.ini
        0x6012, // LD V0, 18    (Set X coordinate for 'C')
        0x6112, // LD V1, 18    (Set Y coordinate for 'C')
        0xA03C, // LD I, 0x03C  (Point to 'C' in the font set)
        0xD015, // DRW V0, V1, 5 (Draw 'C')
        0x121A, // JP 0x21A    (Infinite loop at the end)
    ];
const data = new Uint16Array(instructions);

const ptr = 0; 

const mem = new Uint16Array(opco.memory.buffer);
mem.set(data, ptr);

opco.initializeCpu(ptr * 2, data.length, 13);

console.log(fbData);

</script>

<style scoped></style>
