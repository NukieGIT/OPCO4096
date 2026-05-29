<template>

<main>
  <TileableLayout :node="layout">
    <template #leaf="{ id }">
      <DragDropPane :id="id">
        <template #header>
          <p>{{ panes[id]?.title || id }}</p>
        </template>
        <component v-if="panes[id]" :is="panes[id].is" v-bind="panes[id].props" :id="id" />
      </DragDropPane>
    </template>
  </TileableLayout>
  <DragDropPreview ref="dndPreview" />
</main>

</template>

<script setup lang="ts">
import DragDropPane from '@/components/DragDropPane.vue';
import TestComp1 from '@/components/TestComp1.vue';
import TestComp2 from '@/components/TestComp2.vue';
import type { LayoutNode } from '@/components/tileable-layout/types';
import TileableLayout from '@/components/tileable-layout/TileableLayout.vue';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { ref, useTemplateRef, type Component } from 'vue';
import { moveNode, swapNodes } from '@/components/tileable-layout/layoutManager';
import DragDropPreview from '@/components/DragDropPreview.vue';

const dndPreviewRef = useTemplateRef('dndPreview')

interface PaneDefinition {
  [key: string]: {
    is: Component,
    props: Record<string, unknown>
    title?: string,
  }
}

const panes: PaneDefinition = {
  'TestComp1': { is: TestComp1, props: {}, title: 'Test Component 1' },
  'TestComp2': { is: TestComp2, props: {}, title: 'Test Component 2' },
  'TestComp2FunnyNamed': { is: TestComp2, props: { customName: 'Funny Named TestComp2' }, title: 'Funny Named Test Component 2' },
}

const layout = ref<LayoutNode>({
  type: 'split',
  id: crypto.randomUUID(),
  direction: 'row',
  children: [
    { type: 'leaf', id: 'TestComp1' },
    {
      type: 'split',
      id: crypto.randomUUID(),
      direction: 'column',
      children: [
        { type: 'leaf', id: 'TestComp2' },
        { type: 'leaf', id: 'TestComp2FunnyNamed' }
      ]
    }
  ]
});

function isId(id: unknown): id is string {
  return typeof id === 'string';
}

function clientCoordsToElementCoords(clientX: number, clientY: number, element: Element) {
  const rect = element.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top, xNorm: (clientX - rect.left) / rect.width, yNorm: (clientY - rect.top) / rect.height }
}

let snapAction: () => void = () => { }

const dragSnapThreshold = 0.25;

monitorForElements({
  onDrag({ source, location }) {
    const destination = location.current.dropTargets[0]
    if (!destination) {
      // if dragged outside of any drop targets
      return;
    }

    const destinationId = destination.data.id;
    const sourceId = source.data.id;

    if (!isId(sourceId) || !isId(destinationId)) {
      return;
    }

    if (sourceId === destinationId) {
      return;
    }

    if (!dndPreviewRef.value) {
      return;
    }

    const { xNorm, yNorm } = clientCoordsToElementCoords(location.current.input.clientX, location.current.input.clientY, destination.element)

    const elemRect = destination.element.getBoundingClientRect()

    // Horizontal snap
    if (yNorm > dragSnapThreshold && yNorm < (1 - dragSnapThreshold)) {
      if (xNorm < dragSnapThreshold) {
        // snap to left
        dndPreviewRef.value.moveTo(elemRect.left, elemRect.top);
        dndPreviewRef.value.resizeTo(elemRect.left + elemRect.width / 2, elemRect.bottom);
        dndPreviewRef.value.isVisible = true;
        snapAction = () => {
          moveNode(layout.value, sourceId, destinationId, 0, 'row')
        }
        return;
      } else if (xNorm > (1 - dragSnapThreshold)) {
        // snap to right
        dndPreviewRef.value.moveTo(elemRect.left + elemRect.width / 2, elemRect.top);
        dndPreviewRef.value.resizeTo(elemRect.right, elemRect.bottom);
        dndPreviewRef.value.isVisible = true;
        snapAction = () => {
          moveNode(layout.value, sourceId, destinationId, 1, 'row')
        }
        return;
      }
    }
    // Vertical snap
    else if (xNorm > dragSnapThreshold && xNorm < (1 - dragSnapThreshold)) {
      if (yNorm < dragSnapThreshold) {
        // snap to top
        dndPreviewRef.value.moveTo(elemRect.left, elemRect.top);
        dndPreviewRef.value.resizeTo(elemRect.right, elemRect.bottom - elemRect.height / 2);
        dndPreviewRef.value.isVisible = true;
        snapAction = () => {
          moveNode(layout.value, sourceId, destinationId, 0, 'column')
        }
        return;
      } else if (yNorm > (1 - dragSnapThreshold)) {
        // snap to bottom
        dndPreviewRef.value.moveTo(elemRect.left, elemRect.bottom - elemRect.height / 2);
        dndPreviewRef.value.resizeTo(elemRect.right, elemRect.bottom);
        dndPreviewRef.value.isVisible = true;
        snapAction = () => {
          moveNode(layout.value, sourceId, destinationId, 1, 'column')
        }
        return;
      }
    }
    // full snap
    dndPreviewRef.value.moveTo(elemRect.left, elemRect.top);
    dndPreviewRef.value.resizeTo(elemRect.right, elemRect.bottom);
    dndPreviewRef.value.isVisible = true;
    snapAction = () => {
      swapNodes(layout.value, sourceId, destinationId)
    }
  },
  onDrop({ source, location }) {
    if (dndPreviewRef.value) {
      dndPreviewRef.value.isVisible = false;
    }

    const destination = location.current.dropTargets[0]
    if (!destination) {
      // if dropped outside of any drop targets
      return;
    }

    const destinationId = destination.data.id;
    const sourceId = source.data.id;

    if (!isId(sourceId) || !isId(destinationId)) {
      return;
    }

    if (sourceId === destinationId) {
      return;
    }

    snapAction();
    snapAction = () => { }
  }
})

</script>

<style scoped>

main {
  height: 100dvh;
}

.dragging {
  border-color: #0070f3;
  border-width: 2px;
  border-style: dashed;
}

.dragging-over {
  background-color: rgba(0, 112, 243, 0.1);
}

</style>
