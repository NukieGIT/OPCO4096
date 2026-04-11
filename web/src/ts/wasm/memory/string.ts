import {
  MemoryReader,
  MemoryWriter,
  type EPointer,
  type IReader,
  type IStructReader,
  type IWriter,
  type u32,
} from '@/ts/wasm/memory/raw'
import type { WebAssemblyAllocator } from '@/ts/wasm/OPCO4096Typings'

/**
 * String header stored in WASM memory.
 *
 * @remarks
 * Memory layout (little-endian u32 fields, total 8 bytes):
 * - `ptr`: byte offset of the UTF-8 bytes
 * - `len`: byte length of the UTF-8 bytes
 */
export type EString = EPointer

/**
 * Writes JS strings into WASM memory as UTF-8 and returns a pointer to an
 * {@link EString} header.
 */
export class StringWriter extends MemoryWriter implements IWriter<string> {
  private textEncoder: TextEncoder

  constructor(memory: WebAssembly.Memory, allocator: WebAssemblyAllocator) {
    super(memory, allocator)
    this.textEncoder = new TextEncoder()
  }

  /** @inheritDoc */
  write(str: string): u32 {
    const strBytes = this.textEncoder.encode(str)
    const strPtr = this.writeRaw(strBytes)

    const dataView = new DataView(new ArrayBuffer(8))
    dataView.setUint32(0, strPtr, true)
    dataView.setUint32(4, strBytes.length, true)

    return this.writeRaw(new Uint8Array(dataView.buffer))
  }
}

/**
 * Reads an {@link EString} header and decodes UTF-8 bytes into a JS string.
 */
export class StringReader
  extends MemoryReader
  implements IReader<string, EString>, IStructReader<EString>
{
  private textDecoder: TextDecoder

  constructor(memory: WebAssembly.Memory) {
    super(memory)
    this.textDecoder = new TextDecoder()
  }

  /** @inheritDoc */
  read(strOrPtr: EString | u32): string {
    if (typeof strOrPtr === 'number') {
      strOrPtr = this.readStruct(strOrPtr)
    }

    const bytes = this.readRaw(strOrPtr.ptr, strOrPtr.len)
    return this.textDecoder.decode(bytes)
  }

  /** @inheritDoc */
  readStruct(ptr: u32): EString {
    const view = new DataView(this.memory.buffer, ptr, 8)

    const strPtr = view.getUint32(0, true)
    const strLen = view.getUint32(4, true)

    return { ptr: strPtr, len: strLen }
  }
}
