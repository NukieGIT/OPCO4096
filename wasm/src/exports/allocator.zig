const alloc = @import("../allocator.zig");

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