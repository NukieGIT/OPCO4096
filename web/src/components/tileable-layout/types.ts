export type GroupDirection = 'row' | 'column'
export type GroupElement = { type: 'element'; id: string }
export type Group = {
  type: 'group'
  id: string
  direction: GroupDirection
  initialSizeBias?: number
  children: LayoutNode[]
}
export type LayoutNode = GroupElement | Group
