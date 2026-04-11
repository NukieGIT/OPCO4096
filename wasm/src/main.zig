const std = @import("std");

const chip8 = @import("cpu.zig");

const DISPLAY_WIDTH: usize = 64;
const DISPLAY_HEIGHT: usize = 32;

const GLYPH_W: usize = 4;
const GLYPH_H: usize = 5;
const GLYPH_STRIDE: usize = 5; // bytes per glyph in FONT_SET

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

fn clearDisplay() void {
    chip8.cpu.frame_buffer = [_]u8{0} ** (DISPLAY_WIDTH * DISPLAY_HEIGHT);
}

fn hexNibble(c: u8) ?u8 {
    return switch (c) {
        '0'...'9' => c - '0',
        'A'...'F' => c - 'A' + 10,
        'a'...'f' => c - 'a' + 10,
        else => null,
    };
}

fn setPixel(x: usize, y: usize) void {
    if (x >= DISPLAY_WIDTH or y >= DISPLAY_HEIGHT) return;
    chip8.cpu.frame_buffer[y * DISPLAY_WIDTH + x] = 1;
}

fn drawHexDigit(c: u8, x0: usize, y0: usize) void {
    const nib = hexNibble(c) orelse return;
    const base: usize = @as(usize, nib) * GLYPH_STRIDE;
    for (0..GLYPH_H) |row| {
        const b: u8 = chip8.FONT_SET[base + row];
        for (0..GLYPH_W) |col| {
            const mask: u8 = @as(u8, 0x80) >> @intCast(col);
            if ((b & mask) != 0) setPixel(x0 + col, y0 + row);
        }
    }
}

fn drawHexText(text: []const u8, start_x: usize, start_y: usize) void {
    var x: usize = start_x;
    var y: usize = start_y;

    for (text) |c| {
        if (c == ' ') {
            x += GLYPH_W + 1;
            continue;
        }

        if (x + GLYPH_W > DISPLAY_WIDTH) {
            x = start_x;
            y += GLYPH_H + 1;
        }
        if (y + GLYPH_H > DISPLAY_HEIGHT) break;

        drawHexDigit(c, x, y);
        x += GLYPH_W + 1;
    }
}

pub fn main() !void {
    chip8.init();

    clearDisplay();
    drawHexText("DEADBEEF", 0, 0);
    drawHexText("0123456789ABCDEF", 0, GLYPH_H + 1);
    dumpDisplay();
}
