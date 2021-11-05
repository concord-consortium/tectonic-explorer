// Slightly modified Phong shader taken from THREE.ShaderLib:
// https://github.com/mrdoob/three.js/blob/0c51e577afd011aea8d635db2eeb9185b3999889/src/renderers/shaders/ShaderLib/meshphong_frag.glsl.js
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
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>

// --- CUSTOM
// #include <bumpmap_pars_fragment>
// Use custom bump map helpers that use bumpScale attribute instead of uniform.
#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	varying float vBumpScale;

	// Bump Mapping Unparametrized Surfaces on the GPU by Morten S. Mikkelsen
	// http://api.unrealengine.com/attachments/Engine/Rendering/LightingAndShadows/BumpMappingWithoutTangentSpace/mm_sfgrad_bump.pdf
	// Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vUv );
		vec2 dSTdy = dFdy( vUv );

		float Hll = bumpScale * vBumpScale * texture2D( bumpMap, vUv ).x;
		float dBx = bumpScale * vBumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;
		float dBy = bumpScale * vBumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;

		return vec2( dBx, dBy );
	}

	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {

		// Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988

		vec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );
		vec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );
		vec3 vN = surf_norm;		// normalized

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
      case 0: diffuseColor *= texture2D(patterns[0], vUv * patternScale[0]); break;
      case 1: diffuseColor *= texture2D(patterns[1], vUv * patternScale[1]); break;
      case 2: diffuseColor *= texture2D(patterns[2], vUv * patternScale[2]); break;
      case 3: diffuseColor *= texture2D(patterns[3], vUv * patternScale[3]); break;
      case 4: diffuseColor *= texture2D(patterns[4], vUv * patternScale[4]); break;
      case 5: diffuseColor *= texture2D(patterns[5], vUv * patternScale[5]); break;
      case 6: diffuseColor *= texture2D(patterns[6], vUv * patternScale[6]); break;
      case 7: diffuseColor *= texture2D(patterns[7], vUv * patternScale[7]); break;
      case 8: diffuseColor *= texture2D(patterns[8], vUv * patternScale[8]); break;
      case 9: diffuseColor *= texture2D(patterns[9], vUv * patternScale[9]); break;
      case 10: diffuseColor *= texture2D(patterns[10], vUv * patternScale[10]); break;
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
	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
