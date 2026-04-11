const std = @import("std");

const MEMORY_SIZE: u16 = 4096;
const ROM_START_ADDRESS: u16 = 0x0200;

const FONT_SET = [_]u8{
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80, // F
};

const Chip8CPU = struct {
    memory: [MEMORY_SIZE]u8 = [_]u8{0} ** MEMORY_SIZE,
    display: [64 * 32]u8 = [_]u8{0} ** (64 * 32),
    pc: u16 = ROM_START_ADDRESS,
    i: u16 = 0,
    stack: [16]u16 = [_]u16{0} ** 16,
    delay_timer: u8 = 0,
    sound_timer: u8 = 0,
    v: [16]u8 = [_]u8{0} ** 16,

    fn loadFontSet(self: *Chip8CPU) void {
        std.debug.print("[/] Loading font set into RAM...\n", .{});
        for (FONT_SET, 0..) |_, i| {
            self.memory[i] = FONT_SET[i];
        }
        std.debug.print("[+] Font set loaded!\n", .{});
    }
};

var cpu: Chip8CPU = Chip8CPU{};

test "screen" {
    init();
    const u16_INSTRUCTION_SET = [_]u16{ 0x00E0, 0x00E0, 0x00E0, 0x1200 };
    // const u8_INSTRUCTION_SET = [_]u8{};
    for (u16_INSTRUCTION_SET, 0..) |_, i| {
        const value = u16_INSTRUCTION_SET[i];
        const LSB_value: u8 = @truncate(value & 0x00FF);
        const MSB_value: u8 = @truncate(value >> 8 & 0x00FF);
        std.debug.print("LSB: 0x{x} | MSB: 0x{x} | RAW: 0x{x}\n", .{ LSB_value, MSB_value, value });
        cpu.memory[ROM_START_ADDRESS + (i * 2)] = LSB_value;
        cpu.memory[ROM_START_ADDRESS + (i * 2) + 1] = MSB_value;
    }
    for (u16_INSTRUCTION_SET, 0..) |_, j| {
        std.debug.print("\n[?] Current cycle: {}\n", .{j});
        cycle();
    }
    for (0..16) |j| {
        std.debug.print("HEX DUMP at 0x{x} = 0x{x}\n", .{ ROM_START_ADDRESS + j, cpu.memory[ROM_START_ADDRESS + j] });
    }
}

fn init() void {
    std.debug.print("\n[/] Initializing core...\n", .{});
    cpu.loadFontSet();
    std.debug.print("[+] Core initialized!\n", .{});
}

fn cycle() void {
    // Fetch
    const LSB_opcode = cpu.memory[cpu.pc];
    const MSB_opcode = cpu.memory[cpu.pc + 1];
    var opcode: u16 = 0;
    opcode = opcode | MSB_opcode;
    opcode = opcode << 8 | LSB_opcode;
    std.debug.print("[?] Current instruction: 0x{x} at pc: 0x{x}\n", .{ opcode, cpu.pc });
    cpu.pc += 2;

    const first_nibble = opcode & 0xF000; // First hexadecimal number
    const nnn = opcode & 0x0FFF; // 12-bit immediate memory address
    const nn: u8 = @truncate(opcode & 0x00FF); // 8-bit immediate number
    //const n = opcode & 0x000F;  4-bit number
    const x = opcode & 0x0F00; // Register lookup
    const y = opcode & 0x00F0; // Register lookup

    // Decode
    switch (first_nibble) {
        0x0000 => {
            switch (opcode) {
                0x00E0 => { // CLS
                    cpu.display = [_]u8{0} ** (64 * 32);
                    std.debug.print("[+] Cleared screen.\n", .{});
                },
                else => {
                    std.debug.print("[!!!] Invalid instruction: 0x{x}\n", .{opcode});
                },
            }
        },
        0x1000 => { // JP addr
            cpu.pc = nnn;
            std.debug.print("[+] Set pc to 0x{x}\n", .{nnn});
        },
        0x6000 => { // LD Vx, byte
            cpu.v[x] = nn;
            std.debug.print("[+] Put value 0x{x} to register V{x}\n", .{ nn, cpu.v[x] });
        },
        0x7000 => { // ADD Vx, byte
            cpu.v[x] += nn;
            std.debug.print("[+] Add value 0x{x} to register V{x}\n", .{ nn, cpu.v[x] });
        },
        0xA000 => { // LD I, addr
            cpu.i = nnn;
            std.debug.print("[+] Set index register to 0x{x}\n", .{nnn});
        },
        0xD000 => { // DRW Vx, Vy, nibble
            const x_cord = cpu.v[x] & 63; // Column
            const y_cord = cpu.v[y] & 31; // Row
            var screen_offset = cpu.memory[(cpu.memory.len / 2) * y_cord + x_cord]; // Sprite drawing start
            cpu.v[0xF] = 0; // Collision register
            for (0..5) |_| {
                if (cpu.display[screen_offset] > 0) {
                    cpu.v[0xF] = 1;
                } else {
                    cpu.display[screen_offset] = FONT_SET[cpu.i];
                    cpu.i += 0x5;
                    screen_offset += 64;
                }
            }
            std.debug.print("[+] Draw sprite\n", .{});
        },
        else => {
            std.debug.print("[!!!] Invalid instruction: 0x{x}\n", .{opcode});
        },
    }
    std.debug.print("[+] Cycle completed!\n", .{});
}
