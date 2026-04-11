import type { OPCO4096 } from '@/ts/wasm/OPCO4096Typings'
import { validate } from '@/ts/wasm/OPCO4096Validator'

let opco4096Instance: OPCO4096 = null!

const zjb = new window.Zjb()
const importObject: WebAssembly.Imports = {
  zjb: zjb.imports,
  env: {
    memory: new WebAssembly.Memory({ initial: 1 }),
    __stack_pointer: 0,
  },
}

async function load() {
  const response = await fetch('/OPCO4096-wasm.wasm')
  let result: WebAssembly.WebAssemblyInstantiatedSource
  try {
    result = await WebAssembly.instantiateStreaming(response, importObject)
  } catch {
    console.warn(
      'WebAssembly.instantiateStreaming failed, falling back to ArrayBuffer instantiation. Not supported?',
    )
    const bytes = await response.arrayBuffer()
    result = await WebAssembly.instantiate(bytes, importObject)
  }

  validate(result.instance.exports as unknown as OPCO4096)

  zjb.setInstance(result.instance)

  return result.instance.exports as unknown as OPCO4096
}

export async function initialize() {
  if (!opco4096Instance) {
    opco4096Instance = await load()
    return opco4096Instance
  }
  console.warn('OPCO4096 instance already initialized')
  return opco4096Instance
}

export { opco4096Instance as opco }
