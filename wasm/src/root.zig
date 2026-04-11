const std = @import("std");
const zjb = @import("zjb");
const alloc = @import("allocator.zig");

inline fn constConsoleLog(comptime msg: []const u8) void {
    zjb.global("console").call("log", .{zjb.constString(msg)}, void);
}

inline fn consoleLog(msg: []const u8) void {
    const h = zjb.string(msg);
    defer h.release();
    zjb.global("console").call("log", .{h}, void);
}

pub export fn add(a: i32, b: i32) i32 {
    return a + b;
}

pub export fn hello_from_zig() void {
    constConsoleLog("Hello from Zig!");
}

const StringData = struct {
    ptr: [*]const u8,
    len: usize,
};

pub export fn allocate(len: usize) [*]u8 {
    const a = alloc.getAllocator();
    const buf = a.alloc(u8, len) catch @panic("allocation failed");
    return buf.ptr;
}

pub export fn deallocate(ptr: [*]u8, len: usize) void {
    if (len == 0) return;
    const a = alloc.getAllocator();
    a.free(ptr[0..len]);
}

pub export fn printThing(ptr: [*]const u8, len: usize) void {
    const slice = ptr[0..len];
    consoleLog(slice);
}
