const std = @import("std");

const MEMORY_SIZE: u16 = 4096;
const ROM_START_ADDRESS: u16 = 0x200;

const Chip8 = struct {
    memory: [MEMORY_SIZE]u8 = [_]u8{0} ** MEMORY_SIZE,
    display: [64 * 32]u8 = [_]u8{0} ** (64 * 32),
    pc: u16 = ROM_START_ADDRESS,
    i: u16 = 0,
    stack: [16]u16 = [_]u16{0} ** 16,
    delay_timer: u8 = 0,
    sound_timer: u8 = 0,
    v: [16]u8 = [_]u8{0} ** 16
};