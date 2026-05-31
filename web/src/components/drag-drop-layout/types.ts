import type { Component } from "vue"

export interface PaneDefinition {
  [key: string]: {
    is: Component,
    props: Record<string, unknown>
    title?: string,
  }
}
