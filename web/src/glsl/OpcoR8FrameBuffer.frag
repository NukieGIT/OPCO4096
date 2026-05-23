#version 300 es

precision highp float;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 fragColor;

void main() {
  float redValue = texture(uTexture, vec2(vTexCoord.x, 1.0 - vTexCoord.y)).r * 255.0;
  fragColor = vec4(redValue, redValue, redValue, 1.0);
}