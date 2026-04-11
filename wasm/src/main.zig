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
    // Example: draw a sprite at (0,0) using CHIP-8 DRW opcode
    // 0x6000: LD V0, 0
    // 0x6100: LD V1, 0
    // 0xA000: LD I, 0x000
    // 0xD015: DRW V0, V1, 5 (draw 5-byte sprite at (V0,V1) from I)
    // We'll use the font for '0' (first 5 bytes of FONT_SET)
    var instructions = [_]u16{ 0xD01 };
    chip8.init(&instructions, 4);
    dumpDisplay();
}
