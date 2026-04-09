const std = @import("std");
const zjb = @import("zjb");

pub export fn add(a: i32, b: i32) i32 {
    return a + b;
}

pub export fn hello_from_zig() void {
    zjb.global("console").call("log", .{zjb.constString("Hello from Zig")}, void);
}

test "basic add functionality" {
    try std.testing.expect(add(3, 7) == 10);
}