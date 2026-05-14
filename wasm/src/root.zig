const std = @import("std");
const cpu_mod = @import("cpu.zig");

comptime {
    _ = @import("exports/allocator.zig");
    _ = @import("exports/emulator.zig");
}
