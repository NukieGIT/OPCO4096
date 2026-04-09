export interface OPCO4096 extends WebAssemblyExports {
  add(a: number, b: number): number
  hello_from_zig(): void
}

interface WebAssemblyExports {
  memory: WebAssembly.Memory
  [key: string]: WebAssembly.ExportValue
}
