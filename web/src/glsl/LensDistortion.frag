#version 300 es

precision highp float;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 fragColor;

void main() {
  // lens distortion coefficient
  float k = 1.0;
  // cubic distortion value
  float kcube = -0.5;
  float r2 = (vTexCoord.x - 0.5) * (vTexCoord.x - 0.5) + (vTexCoord.y - 0.5) * (vTexCoord.y - 0.5);
  float f = 0.0;
  if (kcube == 0.0) {
    f = 1.0 + r2 * k;
  } else {
    f = 1.0 + r2 * (k + kcube * sqrt(r2));
  };
  float x = f * (vTexCoord.x - 0.5) + 0.5;
  float y = f * (vTexCoord.y - 0.5) + 0.5;
  vec4 inputDistord = texture(uTexture, vec2(x, y));
  // Fake bezel effect by darkening the edges of the screen
  if (x < 0.0 || x > 1.0 || y < 0.0 || y > 1.0) {
    float distToEdgeX = 1.0 - (abs(x - 0.5) * 2.0);
    float distToEdgeY = 1.0 - (abs(y - 0.5) * 2.0);
    float distToEdge = abs(distToEdgeX - distToEdgeY);
    float edgeSmoothingFactor = 0.3;
    float colorDarkness = 0.06;
    inputDistord = vec4(min(edgeSmoothingFactor * distToEdge, colorDarkness), min(edgeSmoothingFactor * distToEdge, colorDarkness), min(edgeSmoothingFactor * distToEdge, colorDarkness), 0.0);
  }
  fragColor = vec4(inputDistord.r, inputDistord.g, inputDistord.b, inputDistord.a);
}