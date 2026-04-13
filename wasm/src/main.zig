const std = @import("std");

const chip8 = @import("cpu.zig");

const DISPLAY_WIDTH: usize = 64;
const DISPLAY_HEIGHT: usize = 32;

fn dumpDisplay() void {
    std.debug.print("\n--- CHIP-8 DISPLAY (64x32) ---\n", .{});
    for (0..DISPLAY_HEIGHT) |y| {
        for (0..DISPLAY_WIDTH) |x| {
            const idx: usize = y * DISPLAY_WIDTH + x;
            const on = chip8.cpu.frame_buffer[idx] != 0;
            const ch: u8 = if (on) @as(u8, '#') else @as(u8, '.');
            std.debug.print("{c}", .{ch});
        }
        std.debug.print("\n", .{});
    }
    std.debug.print("----------------------------\n", .{});
}

pub fn main() !void {
    try chip8.init(50);
    dumpDisplay();
}
