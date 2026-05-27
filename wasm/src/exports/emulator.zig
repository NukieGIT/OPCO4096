const alloc = @import("../allocator.zig");
const cpu_mod = @import("../cpu.zig");
const types = @import("../js/types.zig");

var cpu_instance = cpu_mod.Chip8CPU{};

pub export fn getFramebuffer() *types.ArrayData {
    return types.ArrayData.create(alloc.getAllocator(), cpu_instance.getFramebufferPtr(), 64 * 32, types.ArrayType.U8) catch @panic("GetFrameBuffer failed!");
}

pub export fn initializeCpu(instructions_ptr: [*]u16, instructions_len: u32) void {
    const instructions = instructions_ptr[0..instructions_len];
    cpu_instance.init(instructions);
}

pub export fn tickCpu() void {
    cpu_instance.tick();
}

pub export fn getPC() u16 {
    return cpu_instance.pc;
}

// Keyboard bridge: allow the host to set key state (0..15)
pub export fn setKey(key: u8, pressed: u8) void {
    cpu_instance.setKey(key, pressed != 0);
}

pub export fn updateCpuTimers() void {
    cpu_instance.updateTimers();
}
