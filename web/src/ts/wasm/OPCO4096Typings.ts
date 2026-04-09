export interface OPCO4096 extends WebAssemblyDefaultExports {
  add(a: number, b: number): number
  hello_from_zig(): void
}

interface WebAssemblyDefaultExports {
  memory: WebAssembly.Memory
}
