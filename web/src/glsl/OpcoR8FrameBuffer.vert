#version 300 es

in vec3 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, 1.0);
  vTexCoord = aTexCoord;
}