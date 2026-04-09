<template>
  <h1>Emulation Page</h1>
</template>

<script setup lang="ts">
import { opco } from '@/ts/wasm/OPCO4096'

opco.hello_from_zig()

</script>

<style scoped></style>
