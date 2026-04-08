/// <reference types="vite/client" />

declare module '*.wasm' {
	const exports: Record<string, unknown>
	export = exports
}
