// Core implementation of the CHIP-8 Processing Unit.

// This file handles the Fetch-Decode-Execute cycle and maintains the
// internal state of the VM (Registers, Ram, Stack and Timers).

// Hardware architecure can be found in README.md

const std = @import("std");

pub const MEMORY_SIZE: u16 = 4096;
pub const ROM_START_ADDRESS: u16 = 0x200;

// Standard 16 character (0-F) font set used by CHIP-8 computers
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
    pc: u16 = ROM_START_ADDRESS, // Starts at ROM_START_ADDRESS (0x200); lower memory is reserved for the interpreter and font set
    i: u16 = 0,
    stack: [16]u16 = [_]u16{0} ** 16,
    delay_timer: u8 = 0,
    sound_timer: u8 = 0,
    v: [16]u8 = [_]u8{0} ** 16, // VF is for flags (carry, collision, etc)

    fn loadFontSet(self: *Chip8CPU) void {
        for (FONT_SET, 0..) |_, i| {
            self.memory[i] = FONT_SET[i];
        }
    }

    /// Loads the instructions into ram using big-endian.
    fn loadInstructions(self: *Chip8CPU, hex: []u16) void {
        for (hex, 0..) |value, i| {
            const LSB_value: u8 = @truncate(value & 0x00FF);
            const MSB_value: u8 = @truncate(value >> 8 & 0x00FF);
            // Saving instructions in big-endian
            self.memory[ROM_START_ADDRESS + (i * 2)] = MSB_value;
            self.memory[ROM_START_ADDRESS + (i * 2) + 1] = LSB_value;
        }
    }

    /// Returns the pointer of the frame_buffer array
    pub fn getFramebufferPtr(self: *Chip8CPU) [*]u8 {
        return &self.frame_buffer;
    }

    /// Loads the font set and instructions into RAM.
    pub fn init(self: *Chip8CPU, instructions: []u16) void {
        self.loadFontSet();
        self.loadInstructions(instructions);
    }

    /// The fetch, decode and execute cycle
    pub fn tick(self: *Chip8CPU) void {
        // Fetch

        // Load the instruction in big-endian
        const MSB_instruction = self.memory[self.pc];
        const LSB_instruction = self.memory[self.pc + 1];
        const instruction = (@as(u16, MSB_instruction) << 8) | LSB_instruction;

        // Move the program counter to the next instruction now to avoid code duplication
        self.pc += 2;

        // Extract the opcode and the operands of the instruction
        const opcode = instruction & 0xF000;
        const nnn = instruction & 0x0FFF; // 12-bit immediate memory address
        const nn: u8 = @truncate(instruction & 0x00FF); // 8-bit immediate number
        // n is commented out because it's unused. That will change after I implement more instructions
        //const n = opcode & 0x000F;  4-bit number
        const x = (instruction & 0x0F00) >> 8; // Register lookup
        const y = (instruction & 0x00F0) >> 4; // Register lookup

        // Decode and execute
        switch (opcode) {
            0x0000 => {
                switch (instruction) {
                    0x00E0 => { // CLS
                        self.frame_buffer = [_]u8{0} ** (64 * 32);
                    },
                    else => {},
                }
            },
            0x1000 => { // JP addr
                self.pc = nnn;
            },
            0x6000 => { // LD Vx, byte
                self.v[x] = nn;
            },
            0x7000 => { // ADD Vx, byte
                self.v[x] += nn;
            },
            0xA000 => { // LD I, addr
                self.i = nnn;
            },
            0xD000 => { // DRW Vx, Vy, nibble
                // Writing this instruction was a straight nightmare
                const x_cord = self.v[x]; // Column
                const y_cord = self.v[y]; // Row
                const n = instruction & 0x000F; // Amount of bytes from memory to read, starting at the address in I
                self.v[0xF] = 0; // Collision register
                // For each row
                for (0..n) |n_byte| {
                    const byte = self.memory[self.i + n_byte]; // The byte from font set to display
                    // For each bit inside the byte from the font set
                    for (0..8) |bit_index| {
                        const bit = byte >> 7 - @as(u3, @intCast(bit_index)) & 0b1;
                        if (bit == 1) {
                            // Wrapping logic
                            const pixel_y = (y_cord + n_byte) % 32;
                            const pixel_x = (x_cord + bit_index) % 64;
                            const pixel_index = (pixel_y * 64) + pixel_x; // 1D index calculation

                            // Collision handling
                            // If the pixel on the display is going to be overwriten, set the collision register to 1
                            if (self.frame_buffer[pixel_index] == 1) {
                                self.v[0xF] = 1;
                            }

                            self.frame_buffer[pixel_index] ^= 1;
                        }
                    }
                }
            },
            else => {},
        }
    }
};
