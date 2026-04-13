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
    var instructions = [_]u16{
        // Address 0x200
        0x6002, // LD V0, 2     (Set X coordinate for 'A')
        0x6102, // LD V1, 2     (Set Y coordinate for 'A')
        0xA032, // LD I, 0x032  (Point to 'A' in the font set)
        0xD015, // DRW V0, V1, 5 (Draw 'A')
        0x600A, // LD V0, 10    (Set X coordinate for 'B')
        0x610A, // LD V1, 10    (Set Y coordinate for 'B')
        0xA037, // LD I, 0x037  (Point to 'B' in the font set)
        0xD015, // DRW V0, V1, 5 (Draw 'B')
        0x6012, // LD V0, 18    (Set X coordinate for 'C')
        0x6112, // LD V1, 18    (Set Y coordinate for 'C')
        0xA03C, // LD I, 0x03C  (Point to 'C' in the font set)
        0xD015, // DRW V0, V1, 5 (Draw 'C')
        0x121A, // JP 0x21A    (Infinite loop at the end)
    };
    chip8.init(&instructions, 13);
    dumpDisplay();
}
