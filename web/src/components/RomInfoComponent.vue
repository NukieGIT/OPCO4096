<template>

<p>Title: {{ romName }}</p>
<p>Memory: {{ romSize }} bytes</p>
</template>

<script setup lang="ts">
import { useOpcoRom } from '@/composables/opco/useOpcoRom'

const { romName, romSize } = useOpcoRom()

</script>

<style scoped>



</style>
