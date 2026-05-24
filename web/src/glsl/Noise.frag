#version 300 es

precision highp float;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 fragColor;

void main() {
  vec4 color = texture(uTexture, vTexCoord);
  float density = 0.0001f;
  float n = mod(abs((vTexCoord.x) - 0.5f) + abs((vTexCoord.y) - 0.5f), density) * (1.0f / density);
  color.rgb *= n;
  fragColor = color;
}