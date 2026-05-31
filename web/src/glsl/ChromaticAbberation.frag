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
  vec4 color = texture(uTexture, vTexCoord);
  if (color.a == 0.0) {
    color.a = 1.0;
    fragColor = color;
    return;
  }
  const float multiplier = 0.0002;
  float vDist = abs(vTexCoord.y - 0.5);
  float hDist = abs(vTexCoord.x - 0.5);
  // Stronger towards the edges
  float vPower = smoothstep(0.0, 0.2, vDist);
  float hPower = smoothstep(0.0, 0.05, hDist);
  float slowerTime = uTime * 0.5;
  float randValue = rand(vTexCoord);
  float randomizer = (sin(slowerTime) - cos(slowerTime + randValue) * sin(slowerTime) * cos(slowerTime) + sin(slowerTime * randValue)) * 13.0;
  fragColor = vec4(
    texture(uTexture, vec2(vTexCoord.x - multiplier * hPower * randomizer, vTexCoord.y)).r,
    texture(uTexture, vec2(vTexCoord.x, vTexCoord.y + multiplier * vPower * (randomizer + 3.0))).g,
    texture(uTexture, vec2(vTexCoord.x + multiplier * hPower * (randomizer - 5.5), vTexCoord.y)).b,
    1.0
  );
}