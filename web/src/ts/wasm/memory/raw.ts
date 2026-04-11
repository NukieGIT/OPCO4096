import type { WebAssemblyAllocator } from '@/ts/wasm/OPCO4096Typings'

/**
 * Unsigned 32-bit integer represented as a JavaScript `number`.
 */
export type u32 = number

/**
 * Pointer + length pair for WASM's linear memory (an “enhanced pointer”).
 *
 * @remarks
 * - `ptr` is a byte offset into {@link WebAssembly.Memory}.buffer.
 * - `len` is a byte length.
 */
export type EPointer = {
  /** Byte offset into `memory.buffer`. */
  ptr: u32
  /** Byte length of the referenced data. */
  len: u32
}

/**
 * Generic interface for writing data to WASM memory. Implementations should handle the specifics of how the data is structured in memory.
 */
export interface IWriter<T> {
  /**
   * Writes data to WASM memory and returns a pointer to the location of the struct containing the data.
   * @param data The data to write.
   * @returns A pointer to the location of the struct in WASM memory.
   */
  write(data: T): u32
}

/**
 * Generic interface for reading data from WASM memory. Implementations should handle the specifics of how the data is structured in memory.
 */
export interface IReader<T, U extends EPointer> {
  /**
   * Reads data from WASM memory at the specified pointer.
   * @param ptrOrStruct The pointer or struct to read from.
   * @returns The data read from WASM memory.
   */
  read(ptrOrStruct: U | u32): T
}

/**
 * Generic interface for reading a struct from WASM memory. Implementations should handle the specifics of how the struct is structured in memory.
 */
export interface IStructReader<T extends EPointer> {
  /**
   * Reads the struct header at `ptr` and returns a decoded pointer/length pair.
   * @param ptr The pointer to the struct header in WASM memory.
   * @returns The decoded pointer/length pair.
   */
  readStruct(ptr: u32): T
}

/**
 * Base class for writers that allocate in WASM memory and then copy bytes in.
 *
 * @remarks
 * This class does not free memory by itself. Whatever allocation strategy your
 * WASM module uses, the caller is typically responsible for calling
 * `allocator.deallocate(ptr, len)` when the data is no longer
 * needed.
 */
export abstract class MemoryWriter {
  protected memory: WebAssembly.Memory
  protected allocator: WebAssemblyAllocator

  constructor(memory: WebAssembly.Memory, allocator: WebAssemblyAllocator) {
    this.memory = memory
    this.allocator = allocator
  }

  /**
   * Allocates `bytes.length` bytes in WASM memory and copies `bytes` into it.
   *
    * @remarks
    * - This method allocates but does not free.
    * - How and when you deallocate depends on your module's ABI/ownership rules.
    *   In the simplest case, call `allocator.deallocate(ptr, len)` when done.
   * @returns Pointer (byte offset) to the start of the written region.
   */
  protected writeRaw(bytes: Uint8Array): u32 {
    const ptr = this.allocator.allocate(bytes.length)
    new Uint8Array(this.memory.buffer, ptr, bytes.length).set(bytes)

    return ptr
  }
}

/**
 * Base class for readers that interpret bytes in WASM linear memory.
 */
export abstract class MemoryReader {
  protected memory: WebAssembly.Memory

  constructor(memory: WebAssembly.Memory) {
    this.memory = memory
  }

  /**
   * Returns a `Uint8Array` view into the WASM memory region.
   *
   * @remarks
   * - This performs no bounds checking.
   */
  protected readRaw(ptr: u32, len: u32): Uint8Array {
    return new Uint8Array(this.memory.buffer, ptr, len)
  }
}
