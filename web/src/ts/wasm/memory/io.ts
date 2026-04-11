import type { WebAssemblyAllocator } from "@/ts/wasm/OPCO4096Typings"

export type u32 = number

export abstract class MemoryWriter {
  protected memory: WebAssembly.Memory
  protected allocator: WebAssemblyAllocator

  constructor(memory: WebAssembly.Memory, allocator: WebAssemblyAllocator) {
    this.memory = memory
    this.allocator = allocator
  }

  protected write(bytes: Uint8Array): u32 {
    const ptr = this.allocator.allocate(bytes.length)
    new Uint8Array(this.memory.buffer, ptr, bytes.length).set(bytes)

    return ptr
  }
}

export abstract class MemoryReader {
  protected memory: WebAssembly.Memory

  constructor(memory: WebAssembly.Memory) {
    this.memory = memory
  }

  protected read(ptr: u32, len: u32): Uint8Array {
    return new Uint8Array(this.memory.buffer, ptr, len)
  }
}
