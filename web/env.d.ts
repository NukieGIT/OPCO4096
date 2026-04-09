/// <reference types="vite/client" />

type ZjbInstance = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	imports: any
	setInstance(instance: WebAssembly.Instance): void
}

type ZjbConstructor = {
	new (): ZjbInstance
}

declare global {
	interface Window {
		Zjb: ZjbConstructor
	}
}

export {}
