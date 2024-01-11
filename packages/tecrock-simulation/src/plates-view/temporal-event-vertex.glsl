attribute float size;
attribute vec3 customColor;
varying vec4 vColor;
varying vec2 vUv;

void main() {
    vColor = vec4(customColor, 1.0);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
