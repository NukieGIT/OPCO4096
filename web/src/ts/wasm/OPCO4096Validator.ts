import type { OPCO4096 } from '@/ts/wasm/OPCO4096Typings'

const PLACEHOLDER_FUNCTION_BODY = () => {
  throw new Error('Placeholder function for typing validation')
}
const PLACEHOLDER_OBJECT_BODY = {
  placeholder: 'This is a placeholder object for typing validation',
}

export const OPCO4096ValidationObject: OPCO4096 = {
  memory: PLACEHOLDER_OBJECT_BODY as unknown as WebAssembly.Memory,

  allocate: function (_len: number): number {
    return PLACEHOLDER_FUNCTION_BODY()
  },
  deallocate: function (_ptr: number, _len: number): void {
    PLACEHOLDER_FUNCTION_BODY()
  },

  getFramebuffer: function (): number {
    return PLACEHOLDER_FUNCTION_BODY()
  },
}

const LOG_PREFIX = '[OPCO4096 Validator]'

export function validate(opco: OPCO4096) {
  for (const key in OPCO4096ValidationObject) {
    if (!Object.prototype.hasOwnProperty.call(opco, key)) {
      throw new Error(`${LOG_PREFIX} Missing expected export "${key}" in OPCO4096 instance`)
    }

    const expectedType = typeof OPCO4096ValidationObject[key as keyof OPCO4096]
    const actualType = typeof opco[key as keyof OPCO4096]
    if (expectedType !== actualType) {
      throw new Error(
        `${LOG_PREFIX} Type mismatch for key "${key}": expected ${expectedType}, got ${actualType}`,
      )
    }
  }

  for (const key in opco) {
    if (!Object.prototype.hasOwnProperty.call(OPCO4096ValidationObject, key)) {
      console.warn(`${LOG_PREFIX} Unexpected export "${key}" found in OPCO4096 instance`)
    }
  }
}
