uniform vec3 color;
uniform sampler2D textureUniform;
varying vec4 vColor;
varying vec2 vUv;

void main() {
    gl_FragColor = vColor * texture2D(textureUniform, vUv);
    if (gl_FragColor.a < ALPHATEST) discard;
}
