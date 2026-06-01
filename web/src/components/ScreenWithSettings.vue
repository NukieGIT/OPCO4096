<template>

<ScreenComponent :render-settings="renderSettings" />
<label>
  <input type="checkbox" v-model="renderSettings.enableChromaticAbberation" />
  Enable Chromatic Aberration
</label>
<label>
  <input type="checkbox" v-model="renderSettings.enableLensDistortion" />
  Enable Lens Distortion
</label>
<label>
  <input type="checkbox" v-model="renderSettings.enableNoise" />
  Enable Noise
</label>

</template>

<script setup lang="ts">
import ScreenComponent from '@/components/ScreenComponent.vue';
import { ref } from 'vue';

const renderSettings = ref({
  enableChromaticAbberation: true,
  enableLensDistortion: true,
  enableNoise: true,
})

</script>

<style scoped>



</style>
