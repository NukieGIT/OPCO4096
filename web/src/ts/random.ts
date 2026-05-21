export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomIntRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomChoice<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('randomChoice: array must not be empty')
  }

  const i = Math.floor(Math.random() * array.length)
  const value = array[i]
  if (value === undefined) {
    throw new Error('randomChoice: generated index out of bounds')
  }

  return value
}
