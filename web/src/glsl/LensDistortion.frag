#version 300 es

precision highp float;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 fragColor;

void main() {
  // lens distortion coefficient
  float k = 1.0f;
  // cubic distortion value
  float kcube = -0.5f;
  float r2 = (vTexCoord.x - 0.5f) * (vTexCoord.x - 0.5f) + (vTexCoord.y - 0.5f) * (vTexCoord.y - 0.5f);
  float f = 0.0f;
  if (kcube == 0.0f) {
    f = 1.0f + r2 * k;
  } else {
    f = 1.0f + r2 * (k + kcube * sqrt(r2));
  };
  float x = f * (vTexCoord.x - 0.5f) + 0.5f;
  float y = f * (vTexCoord.y - 0.5f) + 0.5f;
  vec4 inputDistord = texture(uTexture, vec2(x, y));
  // Fake bezel effect by darkening the edges of the screen
  if (x < 0.0f || x > 1.0f || y < 0.0f || y > 1.0f) {
    float distToEdgeX = 1.0f - (abs(x - 0.5f) * 2.0f);
    float distToEdgeY = 1.0f - (abs(y - 0.5f) * 2.0f);
    float distToEdge = abs(distToEdgeX - distToEdgeY);
    float edgeSmoothingFactor = 0.3f;
    float colorDarkness = 0.06f;
    inputDistord = vec4(min(edgeSmoothingFactor * distToEdge, colorDarkness), min(edgeSmoothingFactor * distToEdge, colorDarkness), min(edgeSmoothingFactor * distToEdge, colorDarkness), 1.0f);
  }
  fragColor = vec4(inputDistord.r, inputDistord.g, inputDistord.b, 1.0f);
}