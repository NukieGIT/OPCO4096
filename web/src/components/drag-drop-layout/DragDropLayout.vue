<template>
  <TileableLayout :node="layout">
    <template #leaf="{ id }">
      <slot name="leaf" :id="id">
        <DragDropPane :id="id">
          <template #header>
            <p>{{ panes[id]?.title || id }}</p>
          </template>
          <component v-if="panes[id]" :is="panes[id].is" v-bind="panes[id].props" :id="id" />
        </DragDropPane>
      </slot>
    </template>
  </TileableLayout>
  <DragDropPreview ref="dndPreview" />
</template>

<script setup lang="ts">
import TileableLayout from '@/components/tileable-layout/TileableLayout.vue'
import DragDropPane from '@/components/DragDropPane.vue'
import DragDropPreview from '@/components/DragDropPreview.vue'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useTemplateRef } from 'vue'
import { moveNode, swapNodes } from '@/components/tileable-layout/layoutManager'
import type { LayoutNode } from '@/components/tileable-layout/types'
import type { PaneDefinition } from '@/components/drag-drop-layout/types'

const {
  layout,
  panes,
  dragSnapThreshold = 0.25,
} = defineProps<{
  layout: LayoutNode
  panes: PaneDefinition
  dragSnapThreshold?: number
}>()

function clientCoordsToElementCoords(clientX: number, clientY: number, element: Element) {
  const rect = element.getBoundingClientRect()
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
    xNorm: (clientX - rect.left) / rect.width,
    yNorm: (clientY - rect.top) / rect.height,
  }
}

const dndPreviewRef = useTemplateRef('dndPreview')
let snapAction: () => void = () => {}

monitorForElements({
  onDrag({ source, location }) {
    const destination = location.current.dropTargets[0]
    if (!destination) return

    const destinationId = destination.data.id
    const sourceId = source.data.id
    if (typeof sourceId !== 'string' || typeof destinationId !== 'string') return
    if (!dndPreviewRef.value) return
    if (sourceId === destinationId) {
      dndPreviewRef.value.isVisible = false
      snapAction = () => {}
      return
    }

    const { xNorm, yNorm } = clientCoordsToElementCoords(
      location.current.input.clientX,
      location.current.input.clientY,
      destination.element,
    )
    const elemRect = destination.element.getBoundingClientRect()

    if (xNorm < dragSnapThreshold) {
      dndPreviewRef.value.moveTo(elemRect.left, elemRect.top)
      dndPreviewRef.value.resizeTo(elemRect.left + elemRect.width / 2, elemRect.bottom)
      dndPreviewRef.value.isVisible = true
      snapAction = () => moveNode(layout, sourceId, destinationId, 0, 'row')
      return
    }

    if (xNorm > 1 - dragSnapThreshold) {
      dndPreviewRef.value.moveTo(elemRect.left + elemRect.width / 2, elemRect.top)
      dndPreviewRef.value.resizeTo(elemRect.right, elemRect.bottom)
      dndPreviewRef.value.isVisible = true
      snapAction = () => moveNode(layout, sourceId, destinationId, 1, 'row')
      return
    }

    if (yNorm < dragSnapThreshold) {
      dndPreviewRef.value.moveTo(elemRect.left, elemRect.top)
      dndPreviewRef.value.resizeTo(elemRect.right, elemRect.top + elemRect.height / 2)
      dndPreviewRef.value.isVisible = true
      snapAction = () => moveNode(layout, sourceId, destinationId, 0, 'column')
      return
    }

    if (yNorm > 1 - dragSnapThreshold) {
      dndPreviewRef.value.moveTo(elemRect.left, elemRect.top + elemRect.height / 2)
      dndPreviewRef.value.resizeTo(elemRect.right, elemRect.bottom)
      dndPreviewRef.value.isVisible = true
      snapAction = () => moveNode(layout, sourceId, destinationId, 1, 'column')
      return
    }

    dndPreviewRef.value.moveTo(elemRect.left, elemRect.top)
    dndPreviewRef.value.resizeTo(elemRect.right, elemRect.bottom)
    dndPreviewRef.value.isVisible = true
    snapAction = () => swapNodes(layout, sourceId, destinationId)
  },
  onDrop() {
    if (dndPreviewRef.value) dndPreviewRef.value.isVisible = false
    snapAction()
    snapAction = () => {}
  },
})
</script>

<style scoped></style>
