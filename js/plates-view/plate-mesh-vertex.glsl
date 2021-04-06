// Slightly modified Phong shader taken from THREE.ShaderLib.
// https://github.com/mrdoob/three.js/blob/0c51e577afd011aea8d635db2eeb9185b3999889/src/renderers/shaders/ShaderLib/meshphong_vert.glsl.js
// It supports alpha channel in color attribute. vec4 is used instead of vec3.

// --- CUSTOM:
attribute vec4 color;
varying vec4 vColor;

attribute float vertexBumpScale;
attribute float vertexElevation;
varying float vBumpScale;
varying float vNormElevation;

uniform float ELEVATION_SCALE;
uniform float MIN_ELEVATION;
uniform float MAX_ELEVATION;

float normalizeViewElevation(float viewElevation) {
  return (max(MIN_ELEVATION, min(MAX_ELEVATION, viewElevation / ELEVATION_SCALE)) - MIN_ELEVATION) / (MAX_ELEVATION - MIN_ELEVATION);
}
// ---

#define PHONG
varying vec3 vViewPosition;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
  // --- CUSTOM:
  vColor = color;
  vNormElevation = normalizeViewElevation(vertexElevation);
  vBumpScale = vertexBumpScale;
  // ---
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
	vNormal = normalize( transformedNormal );
#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
  // --- CUSTOM:
  transformed += normalize(objectNormal) * sign(vertexElevation) * pow(vertexElevation, 1.0);
  // ---
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}
