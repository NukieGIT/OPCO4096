const std = @import("std");

pub const MEMORY_SIZE: u16 = 4096;
pub const ROM_START_ADDRESS: u16 = 0x0200;

pub const FONT_SET = [_]u8{
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

pub const Chip8CPU = struct {
    memory: [MEMORY_SIZE]u8 = [_]u8{0} ** MEMORY_SIZE,
    frame_buffer: [64 * 32]u8 = [_]u8{0} ** (64 * 32),
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

    fn loadInstructionsIntoRAM(self: *Chip8CPU, hex: []u16) void {
        std.debug.print("[/] Loading instructions set into RAM...\n", .{});
        for (hex, 0..) |_, i| {
            const value = hex[i];
            const LSB_value: u8 = @truncate(value & 0x00FF);
            const MSB_value: u8 = @truncate(value >> 8 & 0x00FF);
            std.debug.print("[?] LSB: 0x{x} | MSB: 0x{x} | RAW: 0x{x}\n", .{ LSB_value, MSB_value, value });
            self.memory[ROM_START_ADDRESS + (i * 2)] = LSB_value;
            self.memory[ROM_START_ADDRESS + (i * 2) + 1] = MSB_value;
        }
        std.debug.print("[+] Instructions set loaded!\n", .{});
    }
};

pub var cpu: Chip8CPU = Chip8CPU{};

test "screen" {
    var u16_INSTRUCTION_SET = [_]u16{ 0x00E0, 0x00E0, 0x00E0, 0x1200 };
    const DESIRED_RUNTIME_CYCLES = 10;
    init(&u16_INSTRUCTION_SET, DESIRED_RUNTIME_CYCLES);
}

pub fn init(instructions: []u16, runtime_cycles: comptime_int) void {
    std.debug.print("\n[/] Initializing core...\n", .{});
    cpu.loadFontSet();
    cpu.loadInstructionsIntoRAM(instructions);
    for (0..16) |j| {
        std.debug.print("[?] HEX DUMP at 0x{x} = 0x{x}\n", .{ ROM_START_ADDRESS + j, cpu.memory[ROM_START_ADDRESS + j] });
    }
    std.debug.print("[+] Core initialized!\n", .{});
    std.debug.print("[+++] Executing instructions set!\n\n", .{});
    for (0..runtime_cycles) |_| {
        cycle();
    }
    std.debug.print("\n\n[+++] Instructions set finish!\n[?] PC at: 0x{x}\n[?] Index register at: 0x{x}\n[?] System status: ", .{ cpu.pc, cpu.i });
}

pub fn cycle() void {
    // Fetch
    const LSB_opcode = cpu.memory[cpu.pc];
    const MSB_opcode = cpu.memory[cpu.pc + 1];
    var opcode: u16 = 0;
    opcode = opcode | MSB_opcode;
    opcode = opcode << 8 | LSB_opcode;
    cpu.pc += 2;

    const first_nibble = opcode & 0xF000; // First hexadecimal number
    const nnn = opcode & 0x0FFF; // 12-bit immediate memory address
    const nn: u8 = @truncate(opcode & 0x00FF); // 8-bit immediate number
    //const n = opcode & 0x000F;  4-bit number
    const x = opcode & 0x0F00 >> 8; // Register lookup
    const y = opcode & 0x00F0 >> 4; // Register lookup

    // Decode
    switch (first_nibble) {
        0x0000 => {
            switch (opcode) {
                0x00E0 => { // CLS
                    cpu.frame_buffer = [_]u8{0} ** (64 * 32);
                },
                else => {},
            }
        },
        0x1000 => { // JP addr
            cpu.pc = nnn;
        },
        0x6000 => { // LD Vx, byte
            cpu.v[x] = nn;
        },
        0x7000 => { // ADD Vx, byte
            cpu.v[x] += nn;
        },
        0xA000 => { // LD I, addr
            cpu.i = nnn;
        },
        0xD000 => { // DRW Vx, Vy, nibble
            // Writing this instruction was a straight nightmare
            const x_cord = cpu.v[x]; // Column
            const y_cord = cpu.v[y]; // Row
            const n = opcode & 0x000F;
            cpu.v[0xF] = 0; // Collision register
            // Y axis
            for (0..n) |i| {
                const byte = cpu.memory[cpu.i + i];
                // X axis
                for (0..8) |bit_index| {
                    const bit = byte >> 7 - @as(u3, @intCast(bit_index)) & 0b1;
                    if (bit == 1) {
                        const pixel_y = (y_cord + i) % 32;
                        const pixel_x = (x_cord + bit_index) % 64;
                        const pixel_index = (pixel_y * 64) + pixel_x;

                        if (cpu.frame_buffer[pixel_index] == 1) {
                            cpu.v[0xF] = 1;
                        }
                        cpu.frame_buffer[pixel_index] ^= 1;
                    }
                }
            }
        },
        else => {},
    }
}
