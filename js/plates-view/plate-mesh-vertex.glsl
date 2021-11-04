// Slightly modified Phong shader taken from THREE.ShaderLib.
// https://github.com/mrdoob/three.js/blob/0c51e577afd011aea8d635db2eeb9185b3999889/src/renderers/shaders/ShaderLib/meshphong_vert.glsl.js
// It supports alpha channel in color attribute (vec4 is used instead of vec3) + a few custom features like
// hiding vertices, colormap texture, and so on. Custom code is always enclosed in // --- CUSTOM comment.

// --- CUSTOM:
attribute float elevation;
attribute vec4 color;
attribute float hidden;
attribute float vertexBumpScale;
attribute float colormapValue;
in int patternIdx;

varying vec4 vColor;
varying float vHidden;
varying float vBumpScale;
varying float vColormapValue;
flat out int vPatternIdx;
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
  vBumpScale = vertexBumpScale;
  vHidden = hidden;
  vColormapValue = colormapValue;
  vPatternIdx = patternIdx;
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
  transformed += normalize(objectNormal) * elevation;
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
