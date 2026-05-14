const alloc = @import("../allocator.zig");
const cpu_mod = @import("../cpu.zig");
const types = @import("../js/types.zig");

var cpu_instance = cpu_mod.Chip8CPU{};

pub export fn getFramebuffer() *types.ArrayData {
    return types.ArrayData.create(alloc.getAllocator(), cpu_instance.getFramebufferPtr(), 64 * 32, types.ArrayType.U8) catch @panic("GetFrameBuffer failed!");
}

pub export fn initializeCpu(ptr: [*]u16, len: u32, runtime_cycles: u32) void {
    const instructions = ptr[0..len];
    cpu_instance.init(instructions, runtime_cycles);
}
