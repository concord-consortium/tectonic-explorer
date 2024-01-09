uniform vec3 color;
uniform sampler2D textureUniform;
varying vec4 vColor;
varying vec2 vUv;

void main() {
    gl_FragColor = vColor * texture2D(textureUniform, vUv);
    if (gl_FragColor.a < 0.5) discard;

    // Necessary since Three.js r152/153
    #include <tonemapping_fragment>
	  #include <colorspace_fragment>
}
