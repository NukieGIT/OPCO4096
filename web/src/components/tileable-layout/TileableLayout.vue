<template>
  <div v-if="node.type === 'element'" class="pane">
    <slot name="leaf" :id="node.id"></slot>
  </div>

  <div v-else class="split" :data-direction="node.direction">
    <template v-for="(child, index) in node.children" :key="child.id">
      <TileableLayout :node="child" ref="child">
        <template #leaf="{ id }">
          <slot name="leaf" :id="id" />
        </template>
      </TileableLayout>
      <PaneGutter v-if="index < node.children.length - 1" ref="gutter" :direction="node.direction" :min-drag-offset="minDragOffset" :max-drag-offset="maxDragOffset" />
    </template>
  </div>
</template>

<script setup lang="ts">
import PaneGutter from '@/components/tileable-layout/PaneGutter.vue'
import type { LayoutNode } from '@/components/tileable-layout/types'
import { useElementSize } from '@vueuse/core';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'

defineSlots<{ leaf(props: { id: string }): void }>()

const { node } = defineProps<{ node: LayoutNode }>()

const minDragOffset = ref(0)
const maxDragOffset = ref(Number.POSITIVE_INFINITY)

const gutterRef = useTemplateRef('gutter')
const childRef = useTemplateRef('child')

const gridTemplateCss = computed(() => {
  if (node.type === 'element') return '100%'
  const gutterSize = 5
  const equalSplit = 100 / node.children.length

  let template = ''

  for (let i = 0; i < node.children.length; i++) {
    const gutterDiff = gutterRef.value?.[i]?.gutterDiffComputed ?? 0
    const prevGutterDiff = gutterRef.value?.[i - 1]?.gutterDiffComputed ?? 0
    let toAdd = `calc(${equalSplit}% + ${gutterDiff}px - ${prevGutterDiff}px) `
    if (i < node.children.length - 1) {
      toAdd = `calc(${equalSplit}% + ${gutterDiff}px - ${prevGutterDiff}px - ${gutterSize}px) ${gutterSize}px `
    }

    template += toAdd
  }

  return template
})

onMounted(() => {
  if (!childRef.value) {
    return
  }

  if (node.type != 'group') return
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
  display: grid;
  grid-template-columns: v-bind(gridTemplateCss);
  grid-template-rows: 1fr;
  height: 100%;
}

.split[data-direction='column'] {
  grid-template-columns: 1fr;
  grid-template-rows: v-bind(gridTemplateCss);
}
</style>
