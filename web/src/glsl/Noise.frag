#version 300 es

precision highp float;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 fragColor;

void main() {
  vec4 color = texture(uTexture, vTexCoord);
  float density = 0.0001;
  float n = mod(abs((vTexCoord.x) - 0.5) + abs((vTexCoord.y) - 0.5), density) * (1.0 / density);
  color.rgb *= n;
  fragColor = color;
}