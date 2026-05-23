#version 300 es

precision highp float;

uniform sampler2D uTexture;
uniform float uTime;

in vec2 vTexCoord;

out vec4 fragColor;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  const float multiplier = 0.0005;
  float vDist = abs(vTexCoord.x - 0.5);
  float hDist = abs(vTexCoord.y - 0.5);
  // Stronger towards the edges
  float vPower = smoothstep(0.0, 0.6, vDist);
  float hPower = smoothstep(0.0, 0.05, hDist);
  float slowerTime = uTime / 25.0;
  float randValue = rand(vTexCoord);
  float randomizer = (sin(slowerTime) - cos(slowerTime + randValue) * sin(slowerTime) * cos(slowerTime) + sin(slowerTime / randValue)) * 0.5;
  fragColor = vec4(
    texture(uTexture, vec2(vTexCoord.x - multiplier * vPower * randomizer, vTexCoord.y)).r,
    texture(uTexture, vec2(vTexCoord.x, vTexCoord.y + multiplier * hPower * (randomizer + 3.0))).g,
    texture(uTexture, vec2(vTexCoord.x + multiplier * hPower * (randomizer - 5.5), vTexCoord.y)).b,
    1.0
  );
}