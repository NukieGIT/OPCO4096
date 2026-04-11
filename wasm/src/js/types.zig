const std = @import("std");

pub const StringData = struct {
    ptr: [*]const u8,
    len: usize,

    pub fn init(ptr: [*]const u8, len: usize) StringData {
        return .{ .ptr = ptr, .len = len };
    }

    pub fn create(a: std.mem.Allocator, ptr: [*]const u8, len: usize) !*StringData {
        const data = try a.create(StringData);
        data.* = init(ptr, len);
        return data;
    }
};