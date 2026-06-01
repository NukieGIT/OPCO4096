<template>
  <main>
    <DragDropLayout :layout="layout" :panes="panes" />
  </main>
</template>

<script setup lang="ts">
import DebuggerComponent from '@/components/DebuggerComponent.vue';
import DisassemblerComponent from '@/components/DisassemblerComponent.vue';
import DragDropLayout from '@/components/drag-drop-layout/DragDropLayout.vue';
import type { PaneDefinition } from '@/components/drag-drop-layout/types';
import KeypadComponent from '@/components/KeypadComponent.vue';
import RegistersAndStack from '@/components/RegistersAndStack.vue';
import RomHexDump from '@/components/RomHexDump.vue';
import RomInfoComponent from '@/components/RomInfoComponent.vue';
import ScreenWithSettings from '@/components/ScreenWithSettings.vue';
import type { LayoutNode } from '@/components/tileable-layout/types';
import { ref } from 'vue';


const panes: PaneDefinition = {
  ScreenComponent: {
    is: ScreenWithSettings,
    props: {},
    title: 'Screen',
  },
  DisassemblerComponent: {
    is: DisassemblerComponent,
    props: {},
    title: 'Disassembler',
  },
  DebuggerComponent: {
    is: DebuggerComponent,
    props: {},
    title: 'Debugger',
  },
  RegistersAndStackComponent: {
    is: RegistersAndStack,
    props: {},
    title: 'Registers and Stack',
  },
  RomInfoComponent: {
    is: RomInfoComponent,
    props: {},
    title: 'ROM Info',
  },
  KeypadComponent: {
    is: KeypadComponent,
    props: {},
    title: 'Keypad',
  },
  RomHexDumpComponent: {
    is: RomHexDump,
    props: {},
    title: 'ROM Hex Dump',
  },
}

const layout = ref<LayoutNode>({
  type: 'split',
  id: crypto.randomUUID(),
  direction: 'row',
  initialSizeBias: 0.78,
  children: [
    {
      type: 'split',
      id: crypto.randomUUID(),
      direction: 'column',
      children: [
        {
          type: 'split',
          id: crypto.randomUUID(),
          direction: 'row',
          children: [
            {
              type: 'split',
              id: crypto.randomUUID(),
              direction: 'row',
              initialSizeBias: 0.6,
              children: [
                {
                  type: 'leaf',
                  id: 'RomHexDumpComponent'
                },
                {
                  type: 'leaf',
                  id: 'DebuggerComponent'
                },
              ]
            },
            {
              type: 'leaf',
              id: 'ScreenComponent'
            }
          ]
        },
        {
          type: 'split',
          id: crypto.randomUUID(),
          direction: 'row',
          initialSizeBias: 0.66,
          children: [
            {
              type: 'split',
              id: crypto.randomUUID(),
              direction: 'row',
              children: [
                {
                  type: 'leaf',
                  id: 'RegistersAndStackComponent'
                },
                {
                  type: 'leaf',
                  id: 'RomInfoComponent'
                },
              ]
            },
            {
              type: 'leaf',
              id: 'KeypadComponent'
            }
          ]
        }
      ]
    },
    { type: 'leaf', id: 'DisassemblerComponent' },
  ]
})

</script>

<style scoped>
main {
  height: 100dvh;
}
</style>
