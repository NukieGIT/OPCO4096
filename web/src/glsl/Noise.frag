#version 300 es

precision highp float;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 fragColor;

void main() {
  vec4 color = texture(uTexture, vTexCoord);
  gl_FragCoord.xy;
  float n = mod(gl_FragCoord.x, 2.0) - mod(gl_FragCoord.y, 2.0);
  color.rgb *= n;
  fragColor = color;
}