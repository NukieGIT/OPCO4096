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

pub const ArrayType = enum(u32) {
  I32 = 0,
  I64 = 1 << 1,
  F32 = 1 << 2,
  F64 = 1 << 3,
};

pub const ArrayData = struct {
    ptr: [*]const u8,
    len: usize,
    arrType: ArrayType,

    pub fn init(ptr: [*]const u8, len: usize, arrType: ArrayType) ArrayData {
        return .{ .ptr = ptr, .len = len, .arrType = arrType };
    }

    pub fn create(a: std.mem.Allocator, ptr: [*]const u8, len: usize, arrType: ArrayType) !*ArrayData {
        const data = try a.create(ArrayData);
        data.* = init(ptr, len, arrType);
        return data;
    }
};