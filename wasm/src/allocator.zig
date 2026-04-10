const std = @import("std");

const builtin = @import("builtin");

const is_wasm = builtin.target.cpu.arch == .wasm32 or builtin.target.cpu.arch == .wasm64;

pub fn getAllocator() *std.mem.Allocator {
    return if (is_wasm) std.heap.wasm_allocator else std.heap.page_allocator;
}
