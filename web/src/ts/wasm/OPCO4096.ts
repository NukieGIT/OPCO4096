import type { OPCO4096 } from '@/ts/wasm/OPCO4096Typings'

let opco4096Instance: OPCO4096 | null = null

const zjb = new window.Zjb()
const importObject: WebAssembly.Imports = {
  zjb: zjb.imports,
}

export async function load() {
  const response = await fetch("/OPCO4096-wasm.wasm")
  let result: WebAssembly.WebAssemblyInstantiatedSource
  try {
    result = await WebAssembly.instantiateStreaming(response, importObject)
  } catch {
    console.warn("WebAssembly.instantiateStreaming failed, falling back to ArrayBuffer instantiation. Not supported?")
    const bytes = await response.arrayBuffer()
    result = await WebAssembly.instantiate(bytes, importObject)
  }

  zjb.setInstance(result.instance)

  return result.instance.exports as OPCO4096
}

export default async function getOPCO4096Instance() {
  if (!opco4096Instance) {
    opco4096Instance = await load()
  }
  return opco4096Instance
}
