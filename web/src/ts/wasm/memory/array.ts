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
 * Element type tag used by the array ABI.
 *
 * @remarks
 * These are *tags*, not a bitmask to be combined.
 */
export enum ArrayType {
  U8,
  U16,
  I32,
  I64,
  F32,
  F64
}

/**
 * Array header stored in WASM memory.
 *
 * @remarks
 * Memory layout (little-endian u32 fields, total 12 bytes):
 * - `ptr`: byte offset of the element buffer
 * - `len`: byte length of the element buffer
 * - `type`: {@link ArrayType}
 */
export type EArray = EPointer & {
  type: ArrayType
}

/**
 * High-level array value used on the JS side.
 *
 * @remarks
 * - {@link ArrayWriter.write} allocates and writes two regions:
 *   1) the element buffer (`data`), 2) the 12-byte {@link EArray} header.
 */
export type WasmArray =
  | { type: ArrayType.U8; data: Uint8Array }
  | { type: ArrayType.U16; data: Uint16Array }
  | { type: ArrayType.I32; data: Int32Array }
  | { type: ArrayType.I64; data: BigInt64Array }
  | { type: ArrayType.F32; data: Float32Array }
  | { type: ArrayType.F64; data: Float64Array }

/**
 * Writes a {@link WasmArray} into WASM memory and returns a pointer to an
 * {@link EArray} header.
 */
export class ArrayWriter extends MemoryWriter implements IWriter<WasmArray> {
  constructor(memory: WebAssembly.Memory, allocator: WebAssemblyAllocator) {
    super(memory, allocator)
  }

  /** @inheritDoc */
  write(arr: WasmArray): u32 {
    const arrBytes = new Uint8Array(arr.data.buffer, arr.data.byteOffset, arr.data.byteLength)

    const arrPtr = this.writeRaw(arrBytes)

    const dataView = new DataView(new ArrayBuffer(12))
    dataView.setUint32(0, arrPtr, true)
    dataView.setUint32(4, arrBytes.length, true)
    dataView.setUint32(8, arr.type, true)

    return this.writeRaw(new Uint8Array(dataView.buffer))
  }
}

/**
 * Reads an {@link EArray} header and returns a {@link WasmArray}.
 */
export class ArrayReader
  extends MemoryReader
  implements IReader<WasmArray, EArray>, IStructReader<EArray>
{
  constructor(memory: WebAssembly.Memory) {
    super(memory)
  }

  /** @inheritDoc */
  read(arrOrPtr: EArray | u32): WasmArray {
    if (typeof arrOrPtr === 'number') {
      arrOrPtr = this.readStruct(arrOrPtr)
    }

    const bytes = this.readRaw(arrOrPtr.ptr, arrOrPtr.len)
    switch (arrOrPtr.type) {
      case ArrayType.U8:
        return {
          type: ArrayType.U8,
          data: bytes
        }
      case ArrayType.U16:
        return {
          type: ArrayType.U16,
          data: new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2)
        }
      case ArrayType.I32:
        return {
          type: ArrayType.I32,
          data: new Int32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4),
        }
      case ArrayType.I64:
        return {
          type: ArrayType.I64,
          data: new BigInt64Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 8),
        }
      case ArrayType.F32:
        return {
          type: ArrayType.F32,
          data: new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4),
        }
      case ArrayType.F64:
        return {
          type: ArrayType.F64,
          data: new Float64Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 8),
        }
      default:
        throw new Error(`Unknown ArrayType: ${arrOrPtr.type}`)
    }
  }

  /** @inheritDoc */
  readStruct(ptr: u32): EArray {
    const view = new DataView(this.memory.buffer, ptr, 12)

    const arrPtr = view.getUint32(0, true)
    const arrLen = view.getUint32(4, true)
    const type = view.getUint32(8, true)

    return { ptr: arrPtr, len: arrLen, type }
  }
}
