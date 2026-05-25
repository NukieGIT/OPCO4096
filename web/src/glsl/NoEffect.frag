#version 300 es

precision highp float;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 fragColor;

void main() {
  vec4 c = texture(uTexture, vTexCoord);
  fragColor = vec4(c.rgb, 1.0);
}