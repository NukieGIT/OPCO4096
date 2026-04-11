export interface OPCO4096 extends WebAssemblyDefaultExports, WebAssemblyAllocator {}

export interface WebAssemblyAllocator {
  /**
   * Allocates a buffer inside the WASM's memory.
   *
   * @param len Number of bytes to allocate.
   * @returns A pointer (byte offset) to the start of the allocation.
   *
   * @remarks
   * - The returned pointer is an offset into {@link memory}.buffer.
   * - You own the allocation and must call {@link deallocate} with the same `ptr` and `len`.
   */
  allocate(len: number): number

  /**
   * Frees a block previously returned by {@link allocate}.
   *
   * @param ptr Pointer returned by {@link allocate}.
   * @param len The same byte length that was passed to {@link allocate}.
   */
  deallocate(ptr: number, len: number): void
}

interface WebAssemblyDefaultExports {
  memory: WebAssembly.Memory
}
