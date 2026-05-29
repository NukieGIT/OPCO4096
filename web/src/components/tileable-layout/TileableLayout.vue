<template>
  <div v-if="node.type === 'leaf'" class="pane">
    <slot name="leaf" :id="node.id"></slot>
  </div>

  <div v-else class="split" :data-direction="node.direction">
    <TileableLayout v-for="child in node.children" :key="child.id" :node="child">
      <template #leaf="{ id }">
        <slot name="leaf" :id="id" />
      </template>
    </TileableLayout>
    <PaneGutter ref="gutter" :direction="node.direction" />
  </div>
</template>

<script setup lang="ts">
import PaneGutter from '@/components/tileable-layout/PaneGutter.vue';
import type { LayoutNode } from '@/components/tileable-layout/types'
import { computed, useTemplateRef } from 'vue'

defineSlots<{ leaf(props: { id: string }): void }>()

const { node } = defineProps<{ node: LayoutNode }>()

const gutterRef = useTemplateRef('gutter')
const gutterDiffCss = computed(() => {
  if (!gutterRef.value) return '0px'
  return gutterRef.value.gutterDiffCss
})

</script>

<style scoped>
.pane {
  height: 100%;
}

.split {
  --gutter-size: 5px;
  --gutter-line: rgba(255, 255, 255, 0.25);
  --gutter-hover: rgb(0, 153, 255);
  display: grid;
  grid-template-columns: calc(50% + v-bind(gutterDiffCss)) var(--gutter-size) calc(50% - v-bind(gutterDiffCss));
  grid-template-rows: 1fr;
  height: 100%;
}

.split[data-direction='column'] {
  grid-template-columns: 1fr;
  grid-template-rows: calc(50% + v-bind(gutterDiffCss)) var(--gutter-size) calc(50% - v-bind(gutterDiffCss));
}
</style>
