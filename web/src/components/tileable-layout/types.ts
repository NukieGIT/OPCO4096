export type SplitDirection = 'row' | 'column'
export type Leaf = { type: 'leaf'; id: string }
export type Split = {
  type: 'split'
  id: string
  direction: SplitDirection
  children: [LayoutNode, LayoutNode]
}
export type LayoutNode = Leaf | Split
