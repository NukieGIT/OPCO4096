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
    sp: u8 = 0,
    delay_timer: u8 = 0,
    sound_timer: u8 = 0,
    v: [16]u8 = [_]u8{0} ** 16, // VF is for flags (carry, collision, etc)
    // 16-key keypad state (0 = up, 1 = down)
    keypad: [16]u8 = [_]u8{0} ** 16,

    fn loadFontSet(self: *Chip8CPU) void {
        for (FONT_SET, 0..) |_, idx| {
            self.memory[idx] = FONT_SET[idx];
        }
    }

    /// Loads the instructions into ram using big-endian.
    fn loadInstructions(self: *Chip8CPU, hex: []u16) void {
        for (hex, 0..) |value, idx| {
            const LSB_value: u8 = @truncate(value & 0x00FF);
            const MSB_value: u8 = @truncate(value >> 8 & 0x00FF);
            // Saving instructions in big-endian
            self.memory[ROM_START_ADDRESS + (idx * 2)] = MSB_value;
            self.memory[ROM_START_ADDRESS + (idx * 2) + 1] = LSB_value;
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

    /// Set a key state (pressed/released) from the environment (JS host)
    pub fn setKey(self: *Chip8CPU, key: u8, pressed: bool) void {
        if (key < 16) {
            self.keypad[@intCast(key)] = if (pressed) 1 else 0;
        }
    }

    /// Returns the first pressed key index if any, otherwise null
    fn firstPressedKey(self: *Chip8CPU) ?u8 {
        for (0..16) |idx| {
            if (self.keypad[idx] == 1) return @intCast(idx);
        }
        return null;
    }

    /// This must be called at a constant rate of 60Hz (once every 16.67ms)
    pub fn updateTimers(self: *Chip8CPU) void {
        if (self.delay_timer > 0) {
            self.delay_timer -= 1;
        }
        if (self.sound_timer > 0) {
            self.sound_timer -= 1;
            // TODO: Trigger a beep sound in your frontend if sound_timer > 0
        }
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
        const n = instruction & 0x000F; // 4-bit number
        const x = (instruction & 0x0F00) >> 8; // Register lookup
        const y = (instruction & 0x00F0) >> 4; // Register lookup

        // Decode and execute
        switch (opcode) {
            0x0000 => { // CLS
                switch (instruction) {
                    0x00E0 => { // CLS
                        self.frame_buffer = [_]u8{0} ** (64 * 32);
                    },
                    0x00EE => { // RET
                        if (self.sp == 0) {
                            @panic("Stack Underflow!");
                        }
                        self.sp -= 1;
                        self.pc = self.stack[self.sp];
                    },
                    else => {
                        @panic("Unknown opcode!");
                    },
                }
            },
            0x1000 => { // JP addr
                self.pc = nnn;
            },
            0x2000 => { // CALL addr
                if (self.sp >= 16) {
                    @panic("Stack Overflow!");
                }
                self.stack[self.sp] = self.pc;
                self.sp += 1;
                self.pc = nnn;
            },
            0x3000 => { // SE Vx, byte
                if (self.v[x] == nn) {
                    self.pc += 2;
                }
            },
            0x4000 => { // SNE Vx, byte
                if (self.v[x] != nn) {
                    self.pc += 2;
                }
            },
            0x5000 => { // SE Vx, Vy
                if ((instruction & 0x000F) == 0) {
                    if (self.v[x] == self.v[y]) {
                        self.pc += 2;
                    }
                } else {
                    @panic("Invalid opcode format for 0x5000 family!");
                }
            },
            0x6000 => { // LD Vx, byte
                self.v[x] = nn;
            },
            0x7000 => { // ADD Vx, byte
                self.v[x] = self.v[x] +% nn;
            },
            0x8000 => {
                switch (n) {
                    0 => { // LD Vx, Vy
                        self.v[x] = self.v[y];
                    },
                    1 => { // OR Vx, Vy
                        self.v[x] = self.v[x] | self.v[y];
                    },
                    2 => { // AND Vx, Vy
                        self.v[x] = self.v[x] & self.v[y];
                    },
                    3 => { // XOR Vx, Vy
                        self.v[x] = self.v[x] ^ self.v[y];
                    },
                    4 => { // ADD Vx, Vy
                        const sum = @as(u16, self.v[x]) + @as(u16, self.v[y]);
                        const carry: u8 = if (sum > 0xFF) 1 else 0;
                        self.v[x] = @truncate(sum);
                        self.v[0xF] = carry;
                    },
                    5 => { // SUB Vx, Vy
                        const not_borrow: u8 = if (self.v[x] >= self.v[y]) 1 else 0;
                        self.v[x] = self.v[x] -% self.v[y];
                        self.v[0xF] = not_borrow;
                    },
                    6 => { // SHR Vx {, Vy}
                        const lsb = self.v[x] & 1;
                        self.v[x] >>= 1;
                        self.v[0xF] = lsb;
                    },
                    7 => { // SUBN Vx, Vy
                        const not_borrow: u8 = if (self.v[y] >= self.v[x]) 1 else 0;
                        self.v[x] = self.v[y] -% self.v[x];
                        self.v[0xF] = not_borrow;
                    },
                    0xE => { // SHL Vx {, Vy}
                        const msb = (self.v[x] >> 7) & 1;
                        self.v[x] <<= 1;
                        self.v[0xF] = msb;
                    },
                    else => @panic("Unknown 0x8000 sub-opcode!"),
                }
            },
            0xA000 => { // LD I, addr
                self.i = nnn;
            },
            0x9000 => { // SNE Vx, Vy
                if ((instruction & 0x000F) == 0) {
                    if (self.v[x] != self.v[y]) {
                        self.pc += 2;
                    }
                } else {
                    @panic("Invalid opcode format for 0x9000 family!");
                }
            },
            0xB000 => { // JP V0, addr
                self.pc = nnn + self.v[0];
            },
            0xC000 => { // RND Vx, byte
                const state = struct {
                    var seed: u64 = 0x123456789ABCDEF0; // Fallback initial seed
                };
                // Mix the existing seed with the program counter to add a bit of variance
                state.seed = (state.seed ^ self.pc) +% 1;

                var prng = std.Random.DefaultPrng.init(state.seed);
                const rand_byte = prng.random().int(u8);

                self.v[x] = rand_byte & nn;
            },
            0xD000 => { // DRW Vx, Vy, nibble
                // Writing this instruction was a straight nightmare
                const x_cord = self.v[x]; // Column
                const y_cord = self.v[y]; // Row
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
            0xE000 => {
                switch (nn) {
                    0x9E => { // SKP Vx
                        if (self.keypad[@intCast(self.v[x])] == 1) {
                            self.pc += 2;
                        }
                    },
                    0xA1 => { // SKNP Vx
                        if (self.keypad[@intCast(self.v[x])] == 0) {
                            self.pc += 2;
                        }
                    },
                    else => @panic("Unknown 0xE000 sub-opcode!"),
                }
            },
            0xF000 => {
                switch (nn) {
                    0x07 => { // LD Vx, DT
                        self.v[x] = self.delay_timer;
                    },
                    0x0A => { // LD Vx, K
                        // Unpacking the ?u8 optional safely inside the switch
                        if (self.firstPressedKey()) |k| {
                            self.v[x] = k;
                        } else {
                            // No key pressed -> lock execution context on this command
                            self.pc -= 2;
                        }
                    },
                    0x15 => { // LD DT, Vx
                        self.delay_timer = self.v[x];
                    },
                    0x18 => { // LD ST, Vx
                        self.sound_timer = self.v[x];
                    },
                    0x1E => { // ADD I, Vx
                        self.i = self.i +% self.v[x];
                    },
                    0x29 => { // LD F, Vx
                        self.i = @as(u16, self.v[x]) * 5;
                    },
                    0x33 => { // LD B, Vx
                        var value = self.v[x];
                        self.memory[self.i + 2] = value % 10;
                        value /= 10;
                        self.memory[self.i + 1] = value % 10;
                        value /= 10;
                        self.memory[self.i] = value % 10;
                    },
                    0x55 => { // LD [I], Vx
                        for (0..x + 1) |reg_idx| {
                            self.memory[self.i + @as(u16, @intCast(reg_idx))] = self.v[reg_idx];
                        }
                    },
                    0x65 => { // LD Vx, [I]
                        for (0..x + 1) |reg_idx| {
                            self.v[reg_idx] = self.memory[self.i + @as(u16, @intCast(reg_idx))];
                        }
                    },
                    else => @panic("Unknown 0xF000 sub-opcode!"),
                }
            },
            else => @panic("Completely unknown opcode format!"),
        }
    }
};
