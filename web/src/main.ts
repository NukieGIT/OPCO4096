import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initialize, opco } from '@/ts/wasm/OPCO4096'

await initialize()

// Simple CHIP-8 keyboard mapping. Maps physical keys to CHIP-8 keypad (0x0-0xF).
const KEY_MAP: Record<string, number> = {
	'1': 0x1,
	'2': 0x2,
	'3': 0x3,
	'4': 0xC,
	'q': 0x4,
	'w': 0x5,
	'e': 0x6,
	'r': 0xD,
	'a': 0x7,
	's': 0x8,
	'd': 0x9,
	'f': 0xE,
	'z': 0xA,
	'x': 0x0,
	'c': 0xB,
	'v': 0xF,
}

function handleKeyEvent(ev: KeyboardEvent, pressed: boolean) {
	const key = ev.key.toLowerCase();
	const mapped = KEY_MAP[key];
	if (mapped === undefined) return;
	if (opco && typeof opco.setKey === 'function') {
		try {
			opco.setKey(mapped, pressed ? 1 : 0)
		} catch (e) {
			// setKey might not be available if WASM not compiled with export; ignore
			console.warn('setKey failed', e)
		}
		ev.preventDefault();
	}
}

window.addEventListener('keydown', (e) => handleKeyEvent(e, true))
window.addEventListener('keyup', (e) => handleKeyEvent(e, false))

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
