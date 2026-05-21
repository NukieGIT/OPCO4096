#version 300 es

precision highp float;

in vec2 vTexCoord;

uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
  float redValue = texture(uTexture, vTexCoord).r * 255.0;
  fragColor = vec4(redValue, redValue, redValue, 1.0);
}