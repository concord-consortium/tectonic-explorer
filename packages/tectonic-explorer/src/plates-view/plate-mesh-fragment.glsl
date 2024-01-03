// Slightly modified Phong shader taken from THREE.ShaderLib:
// https://github.com/mrdoob/three.js/blob/b398bc410bd161a88e8087898eb66639f03762be/src/renderers/shaders/ShaderLib/meshphong.glsl.js
// It supports alpha channel in color attribute (vec4 is used instead of vec3) + a few custom features like
// hiding vertices, colormap texture, and so on. Custom code is always enclosed in // --- CUSTOM comment.

// --- CUSTOM:
varying vec4 vColor;
varying float vHidden;
varying float vColormapValue;
flat in int vPatternIdx;

uniform sampler2D colormap;
// Keep array length equal to number of rock patterns.
uniform sampler2D patterns[11];
uniform float patternScale[11];
uniform bool usePatterns;
// ---

#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>

// --- CUSTOM
// Use custom bump map helpers that use bumpScale attribute instead of uniform.
// REPLACE:
// #include <bumpmap_pars_fragment>
// WITH the customized version of bumpmap_pars_fragment.glsl.js:
#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	varying float vBumpScale; // <--- CUSTOM: new variable

  // Bump Mapping Unparametrized Surfaces on the GPU by Morten S. Mikkelsen
	// https://mmikk.github.io/papers3d/mm_sfgrad_bump.pdf

	// Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)


	vec2 dHdxy_fwd() {

		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );

		float Hll = bumpScale * vBumpScale * texture2D( bumpMap, vBumpMapUv ).x; // <--- CUSTOM: * vBumpScale
		float dBx = bumpScale * vBumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll; // <--- CUSTOM: * vBumpScale
		float dBy = bumpScale * vBumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll; // <--- CUSTOM: * vBumpScale

		return vec2( dBx, dBy );

	}

  vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {

		vec3 vSigmaX = dFdx( surf_pos.xyz );
		vec3 vSigmaY = dFdy( surf_pos.xyz );
		vec3 vN = surf_norm; // normalized

		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );

		float fDet = dot( vSigmaX, R1 ) * faceDirection;

		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );

	}

#endif
// ---

#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

  vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>

  // --- CUSTOM:
  if (vHidden == 1.0) {
    // Hide pixel.
    diffuseColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else if (vColor.a > 0.5) {
    // Use specific color provided in color attribute. For example plate boundary color.
    // Note that rendering only for alpha > X (e.g. 0.75 or 0.5) makes this color line thinner.
    diffuseColor *= vec4(vColor.r, vColor.g, vColor.b, 1.0);
  } else if (usePatterns == true) {
    // This doesn't look convincing, but unfortunately that's the only way to do it in GLSL (=> version supported by
    // WebGL to be more specific). It's impossible to simply say:
    // `texture2D(patterns[vPatternIdx], vUv * patternScale[vPatternIdx]);`
    // GLSL compiler returns an error saying that "array index for samplers must be constant integral expressions".
    switch (vPatternIdx) {
      case 0: diffuseColor *= texture2D(patterns[0], vBumpMapUv * patternScale[0]); break;
      case 1: diffuseColor *= texture2D(patterns[1], vBumpMapUv * patternScale[1]); break;
      case 2: diffuseColor *= texture2D(patterns[2], vBumpMapUv * patternScale[2]); break;
      case 3: diffuseColor *= texture2D(patterns[3], vBumpMapUv * patternScale[3]); break;
      case 4: diffuseColor *= texture2D(patterns[4], vBumpMapUv * patternScale[4]); break;
      case 5: diffuseColor *= texture2D(patterns[5], vBumpMapUv * patternScale[5]); break;
      case 6: diffuseColor *= texture2D(patterns[6], vBumpMapUv * patternScale[6]); break;
      case 7: diffuseColor *= texture2D(patterns[7], vBumpMapUv * patternScale[7]); break;
      case 8: diffuseColor *= texture2D(patterns[8], vBumpMapUv * patternScale[8]); break;
      case 9: diffuseColor *= texture2D(patterns[9], vBumpMapUv * patternScale[9]); break;
      case 10: diffuseColor *= texture2D(patterns[10], vBumpMapUv * patternScale[10]); break;
    }
  } else {
    // Use the default colormap if vColor is transparent.
    diffuseColor *= texture2D(colormap, vec2(0.5, vColormapValue));
  }
  // ---

	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
