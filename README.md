<div align="center">

<img src="http://gitea.lan/Noworlax/OPCO4096/actions/workflows/build-and-test.yaml/badge.svg?branch=main" alt="CI Status" />

</div>
<h1 align="center">
<br>
<img src="web/src/assets/svg/logo.svg" align="center">
<p>OPCO4096</p>
<p style="font-size: 1rem; font-weight: normal;">Virtual Machine & CHIP-8 interpreter</p>
<br>
<p style="font-size: 1.5rem; font-weight: bold; margin: 0;" align="left">Introduction</p>
</h1>

A web-based implementation of the **CHIP-8** programming language with the interpreter written in **ZIG**.
Designed to bridge the gap between high-level reactive frameworks (**Vue 3**) and low-level systems architecture using **WASM**. Originally created for a web app class assigment. Keep in mind that this is my first ever experience with Zig and any kind of emulation development.

## Installation (dev)

### Prerequisites
* [Node.js](https://nodejs.org/) (latest LTS recommended)
* [Zig](https://ziglang.org/) (0.15.2 recommended)

*This project requires **Zig 0.15.2**. It will not compile with Zig 0.16.x or later due to breaking changes in the compiler API.*

*If you use VS Code, the integrated terminal should automatically select the correct version if you have the Zig extension installed. Otherwise, ensure your global `zig version` outputs `0.15.2`.* 

### Running the project (step-by-step)

```bash
# Clone the repo
> git clone https://gitea.lan/noworlax/OPCO4096.git
> cd OPCO4096

# Build the WASM module
> cd wasm/
> zig build wasm

# Install Node.js modules
> cd ../web/
> npm install

# Run the app
> npm run dev
```

## System Architecture
- **CPU:** 8-bit Virtual Processor
- **Memory:** 4KB 8-bit RAM (big-endian)
- **Registers:** 16 x 8-bit General Purpose
- **Graphics:** 64x32 Monochromatic display

## License

MIT (see [LICENSE](LICENSE) file for details).