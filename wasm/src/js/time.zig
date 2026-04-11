const zjb = @import("zjb");

pub fn getTime() u64 {
    return @intFromFloat(zjb.global("Date").call("now", .{}, f64));
}