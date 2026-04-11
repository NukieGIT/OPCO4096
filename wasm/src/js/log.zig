const zjb = @import("zjb");

pub fn log(msg: []const u8) void {
    const h = zjb.string(msg);
    defer h.release();
    zjb.global("console").call("log", .{h}, void);
}

pub inline fn constLog(comptime msg: []const u8) void {
    zjb.global("console").call("log", .{zjb.constString(msg)}, void);
}

pub fn warn(msg: []const u8) void {
    const h = zjb.string(msg);
    defer h.release();
    zjb.global("console").call("warn", .{h}, void);
}

pub inline fn constWarn(comptime msg: []const u8) void {
    zjb.global("console").call("warn", .{zjb.constString(msg)}, void);
}

pub fn err(msg: []const u8) void {
    const h = zjb.string(msg);
    defer h.release();
    zjb.global("console").call("error", .{h}, void);
}

pub inline fn constErr(comptime msg: []const u8) void {
    zjb.global("console").call("error", .{zjb.constString(msg)}, void);
}
