const std = @import("std");

const builtin = @import("builtin");

const is_wasm = builtin.target.cpu.arch == .wasm32 or builtin.target.cpu.arch == .wasm64;

var debug_allocator: std.heap.DebugAllocator(.{}) = .{};

pub fn getAllocator() std.mem.Allocator {
    return if (is_wasm) std.heap.wasm_allocator else debug_allocator.allocator();
}

pub fn deInit() void {
    if (debug_allocator.deinit() == .leak) @panic("memory leak?");
}