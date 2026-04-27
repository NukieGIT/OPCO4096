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

export fn getFramebuffer() *WasmArrayHeader {
    fb_header.ptr = cpu_mod.Chip8CPU.getFramebufferPtr(&cpu_instance);

    return &fb_header;
}

export fn initializeCpu(ptr: [*]u16, len: u32, runtime_cycles: u32) void {
    const instructions = ptr[0..len];
    cpu_instance.init(instructions, runtime_cycles);
}
