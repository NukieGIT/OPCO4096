const std = @import("std");
const time = @import("js/time.zig");

pub fn getInitRandom() std.Random {
    var prng = std.Random.DefaultPrng.init(time.getTime());
    return prng.random();
}