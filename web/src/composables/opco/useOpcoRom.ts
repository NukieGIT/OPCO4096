import { computed, ref } from 'vue'
import { ArrayReader, ArrayType, ArrayWriter } from '@/ts/wasm/memory/array'
import { opco } from '@/ts/wasm/OPCO4096'

const rom = ref<Uint16Array>(new Uint16Array())
const romName = ref<string | null>(null)

let writer: ArrayWriter | null = null
let reader: ArrayReader | null = null

function ensureWriters() {
  if (writer && reader) return { writer, reader }
  if (!opco?.memory) return null

  writer = new ArrayWriter(opco.memory, opco)
  reader = new ArrayReader(opco.memory)
  return { writer, reader }
}

function setRom(newRom: Uint16Array) {
  rom.value = newRom

  const io = ensureWriters()
  if (!io || typeof opco?.initializeCpu !== 'function') return

  const romData = io.writer.write({ type: ArrayType.U16, data: newRom })
  const romReader = io.reader.readStruct(romData)

  opco.initializeCpu(romReader.ptr, romReader.len)
}

function setRomName(name: string | null) {
  romName.value = name
}

export function useOpcoRom() {
  const romSize = computed(() => rom.value.length * 2)
  const hasRom = computed(() => rom.value.length > 0)

  function loadRomFromArrayBuffer(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer)
    const opcodes = new Uint16Array(bytes.length / 2)

    for (let i = 0; i < opcodes.length; i++) {
      const highByte = bytes[i * 2] ?? 0
      const lowByte = bytes[i * 2 + 1] ?? 0
      opcodes[i] = (highByte << 8) | lowByte
    }

    setRom(opcodes)
  }

  async function loadRomFromFile(file: File) {
    setRomName(file.name)
    const buffer = await file.arrayBuffer()
    loadRomFromArrayBuffer(buffer)
    return buffer
  }

  function ejectRom() {
    setRom(new Uint16Array())
    setRomName(null)
  }

  return {
    rom,
    romName,
    romSize,
    hasRom,
    setRom,
    setRomName,
    loadRomFromArrayBuffer,
    loadRomFromFile,
    ejectRom,
  }
}
