const std = @import("std");
const cpu_mod = @import("cpu.zig");

comptime {
    _ = @import("exports/allocator.zig");
}

var cpu_instance = cpu_mod.Chip8CPU{};

// Match WASM array requirements
const WasmArrayHeader = extern struct {
    ptr: [*]u8, // Pointer to the array
    len: u32, // Length of the array
    type: u32, // Data type of the array
};

// A static header so JS has a consistent address to hit
var fb_header = WasmArrayHeader{
    .ptr = undefined,
    .len = 2048,
    .type = 0,
};

// TODO make functions in cpu.zig use the struct itself instead of an instance created in cpu.zig (otherwise WASM and Zig are using 2 different instances)
export fn getFramebuffer() *WasmArrayHeader {
    fb_header.ptr = cpu_mod.Chip8CPU.getFramebufferPtr(&cpu_instance);

    return &fb_header;
}
