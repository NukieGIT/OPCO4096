<template>
  <div v-if="node.type === 'leaf'" class="pane">
    <slot name="leaf" :id="node.id"></slot>
  </div>

  <div v-else class="split" :data-direction="node.direction">
    <TileableLayout v-for="child in node.children" :key="child.id" :node="child" ref="child">
      <template #leaf="{ id }">
        <slot name="leaf" :id="id" />
      </template>
    </TileableLayout>
    <PaneGutter ref="gutter" :direction="node.direction" :min-drag-offset="minDragOffset" :max-drag-offset="maxDragOffset" />
  </div>
</template>

<script setup lang="ts">
import PaneGutter from '@/components/tileable-layout/PaneGutter.vue'
import type { LayoutNode } from '@/components/tileable-layout/types'
import { clamp, useElementSize } from '@vueuse/core';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'

defineSlots<{ leaf(props: { id: string }): void }>()

const { node } = defineProps<{ node: LayoutNode }>()

const minDragOffset = ref(0)
const maxDragOffset = ref(Number.POSITIVE_INFINITY)

const childRef = useTemplateRef('child')
onMounted(() => {
  if (!childRef.value) {
    return
  }

  if (node.type != 'split') return
  const child1Size = useElementSize(childRef.value[0])
  const child2Size = useElementSize(childRef.value[1])

  if (node.direction === 'row') {
    watch([child1Size.width, child2Size.width], ([child1Width, child2Width]) => {
      const totalWidth = child1Width + child2Width
      if (totalWidth === 0) return
      minDragOffset.value = -totalWidth / 2 + 50
      maxDragOffset.value = totalWidth / 2 - 50
    })
  } else {
    watch([child1Size.height, child2Size.height], ([child1Height, child2Height]) => {
      const totalHeight = child1Height + child2Height
      if (totalHeight === 0) return
      minDragOffset.value = -totalHeight / 2 + 50
      maxDragOffset.value = totalHeight / 2 - 50
    })
  }
})

const gutterRef = useTemplateRef<InstanceType<typeof PaneGutter>>('gutter')
const gutterDiffCss = computed(() => {
  if (!gutterRef.value) return '0px'
  return gutterRef.value.gutterDiffCss
})

const initialSizeBias = computed(() => {
  if (node.type === 'leaf') return 0.5
  return clamp(node.initialSizeBias ?? 0.5, 0, 1)
})
const initialSizeBiasCss = computed(() => initialSizeBias.value * 100 + '%')

</script>

<style scoped>
.pane {
  display: flex;
  height: 100%;
  min-width: 0;
}

.pane > * {
  flex-grow: 1;
}

.split {
  --gutter-size: 5px;
  --gutter-line: rgba(255, 255, 255, 0.25);
  --gutter-hover: rgb(0, 153, 255);
  display: grid;
  grid-template-columns: calc(v-bind(initialSizeBiasCss) + v-bind(gutterDiffCss) - var(--gutter-size) / 2) var(
      --gutter-size
    ) calc(100% - v-bind(initialSizeBiasCss) - v-bind(gutterDiffCss) - var(--gutter-size) / 2);
  grid-template-rows: 1fr;
  height: 100%;
}

.split[data-direction='column'] {
  grid-template-columns: 1fr;
  grid-template-rows: calc(v-bind(initialSizeBiasCss) + v-bind(gutterDiffCss) - var(--gutter-size) / 2) var(
      --gutter-size
    ) calc(100% - v-bind(initialSizeBiasCss) - v-bind(gutterDiffCss) - var(--gutter-size) / 2);
}
</style>
