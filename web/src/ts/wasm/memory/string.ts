import { MemoryReader, MemoryWriter, type u32 } from '@/ts/wasm/memory/io'
import type { WebAssemblyAllocator } from '@/ts/wasm/OPCO4096Typings'

/**
 * Represents a UTF-8 encoded string in WASM memory.
 */
export type String = {
  /**
   * Pointer to the start of the UTF-8 encoded string in WASM memory.
   */
  ptr: u32
  /**
   * Length of the string in bytes.
   */
  len: u32
}

export class StringWriter extends MemoryWriter {
  private textEncoder: TextEncoder

  constructor(memory: WebAssembly.Memory, allocator: WebAssemblyAllocator) {
    super(memory, allocator)
    this.textEncoder = new TextEncoder()
  }

  /**
   * Writes a string to WASM memory.
   * @param str String to write.
   * @returns Pointer to {@link String} struct.
   */
  writeString(str: string): u32 {
    const strBytes = this.textEncoder.encode(str)
    const strPtr = this.write(strBytes)

    const dataView = new DataView(new ArrayBuffer(8))
    dataView.setUint32(0, strPtr, true)
    dataView.setUint32(4, strBytes.length, true)

    const structPtr = this.write(new Uint8Array(dataView.buffer))

    return structPtr
  }
}

export class StringReader extends MemoryReader {
  private textDecoder: TextDecoder

  constructor(memory: WebAssembly.Memory) {
    super(memory)
    this.textDecoder = new TextDecoder()
  }

  readString(strOrPtr: String | u32): string {
    if (typeof strOrPtr === 'number') {
      strOrPtr = this.getStructFromStringData(strOrPtr)
    }

    const bytes = this.read(strOrPtr.ptr, strOrPtr.len)
    return this.textDecoder.decode(bytes)
  }

  getStructFromStringData(ptr: u32): String {
    const view = new DataView(this.memory.buffer, ptr, 8)

    const strPtr = view.getUint32(0, true)
    const strLen = view.getUint32(4, true)

    return { ptr: strPtr, len: strLen }
  }
}
