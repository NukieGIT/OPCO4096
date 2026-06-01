import { opco } from '@/ts/wasm/OPCO4096'

export function useOpcoInput() {
  function setKey(key: number, pressed: boolean) {
    opco.setKey(key, pressed ? 1 : 0)
  }

  return { setKey }
}
