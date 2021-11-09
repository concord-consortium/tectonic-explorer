import { getURLParam } from "./utils";

export type Colormap = "topo" | "plate" | "age" | "rock";

const DEFAULT_CONFIG = {
  // Authoring mode that lets user pick a planet layout and put continents on them.
  // Usually it is overwritten using URL param: planetWizard=true.
  planetWizard: false,
  planetWizardSteps: ["presets", "continents", "forces", "densities"],
  // There are two variants of wording in the planet wizard. One is using word "density", and the other one
  // avoids this word on purpose. This setting lets author pick one of these variants.
  densityWordInPlanetWizard: true,
  // If this option is set to true, users won't be able to rotate camera in boundary type and densities assignment steps.
  cameraLockedInPlanetWizard: true,
  // One of the cases defined in presets.js file that will be loaded automatically.
  // Usually it is overwritten using URL param: preset=subduction.
  preset: "",
  // The identifier of a model stored in Firebase that will be loaded automatically.
  modelId: "",
  // If true, the model will start automatically.
  playing: true,
  // If true, the model will show randomly generated earthquakes.
  earthquakes: false,
  // Lifespan of an earthquake in model time.
  earthquakeLifespan: 1,
  // Constant that decides how likely is for an earthquake to show up in the subduction zone.
  earthquakeInSubductionZoneProbability: 300,
  // Constant that decides how likely is for an earthquake to show up in the divergent boundary zone.
  earthquakeInDivergentZoneProbability: 540,
  // If true, the model will show randomly generated volcanic eruptions.
  volcanicEruptions: false,
  // Lifespan of a volcanic eruption in model time.
  volcanicEruptionLifespan: 2,
  volcanicEruptionColor: "FF7A00",
  // Constant that decides how likely is for an volcanic eruption to occur on the continent.
  volcanicEruptionOnContinentProbability: 80,
  // Constant that decides how likely is for an earthquake to show up in the divergent boundary zone.
  // Value is exaggerated as the area is very limited.
  volcanicEruptionInDivergentZoneProbability: 800,
  // Ease-out transition time when earthquake shows up and disappears.
  tempEventTransitionTime: 750, // ms
  // If number of steps is provided, model will stop every `stopAfter` steps. This is useful mostly for automated
  // testing, but author could also use that to stop model after some time and focus on some phenomena.
  stopAfter: Infinity,
  // Save model state every N steps. It can be restored later.
  snapshotInterval: 100,
  divisions: 32,
  timestep: 0.1,
  // When set to true, model will always behave in the same way, random events will always have the same results.
  deterministic: true,
  // There are three different integration methods: 'euler', 'verlet' and 'rk4'.
  // Good test case for physics engine: preset=continentalCollision1&constantHotSpots=true
  // e.g. http://localhost:8080/?preset=continentalCollision1&renderForces=true&constantHotSpots=true&integration=verlet
  // - It seems that the Verlet method provides best results so far (forces look pretty stable, model kinetic energy too).
  // - RK4 is more complicated and actually kinetic energy of the model grows faster than in Verlet method. It might
  //   be a bug in the implementation, as RK4 method should provide the best results theoretically.
  // - Euler is the simplest, but also the worst - forces tend to oscillate and kinetic energy grows fast, it quickly
  //   becomes visible in the model.
  // It all becomes less important when constantHotSpots=false, as after some time there are no forces and plates
  // will stop themselves due to light friction / drag force.
  integration: "verlet",
  // By default hot spot torque applied to plates is decreased with time and default friction is really small,
  // so plates drift for a long time. When this option is set to true, hot spot torque won't be changed at all
  // and base friction will be much higher. It affects model behaviour quite a lot.
  // It's also useful for testing various integration methods with continentalCollision1 model.
  constantHotSpots: false,
  // Use Voronoi sphere instead of KD-tree, faster, less accurate, but probably not important for the simulation.
  optimizedCollisions: true,
  // Smoothing of cross-section data. At this moment mainly affects oceanic floor and subducting areas.
  smoothCrossSection: true,
  // Density affects plate's inertia tensor.
  oceanDensity: 1,
  continentDensity: 3,
  // How fast continent is stretching along divergent boundary. Bigger value means it would turn into ocean / see faster.
  continentalStretchingRatio: 8,
  // Max length of the cross-section line
  maxCrossSectionLength: 4000, // km
  // Horizontal scaling of cross-section data.
  crossSectionPxPerKm: 0.2, // px per km
  // Default range of elevation is [0, 1] (the deepest trench, the highest mountain). However subducting plates go
  // deeper and this variable sets the proportion between this depth and normal topography.
  subductionMinElevation: -3.3,
  oceanicRidgeElevation: 0.1,
  oceanicRidgeWidth: 650, // km
  // Width of the area around continent which acts as it's bumper / buffer. When this area is about to subduct,
  // drag forces will be applied to stop relative motion of the plates and prevent subduction of the neighboring continent.
  continentBufferWidth: 1000,
  // Keeps model running. When all the plates reach the point when they move in the same direction, with the same speed,
  // model will add some random forces and divide big plates (see minSizeRatioForDivision).
  enforceRelativeMotion: true,
  // When two plates have almost identical angular velocity, they'll be merged into single plate.
  mergePlates: true,
  // Divide plates that occupy more than X of the planet area. Any value >= 1.0 will disable plate division.
  minSizeRatioForDivision: 0.6,
  // Rendering:
  colormap: "topo", // 'topo', 'age', 'plate', or 'rock'
  // Defines interaction that can be selected using top bar.
  selectableInteractions: ["force", "none"],
  // Enables metamorphic overlay in the cross-section (added in subduction and orogeny zones).
  metamorphism: true,
  metamorphismOrogenyColorSteps: [0.125, 0.375, 0.625],
  metamorphismSubductionColorSteps: [0.15, 0.35],
  metamorphismOrogenyWidth: 0.07,
  // Strength of forces applied during orogeny.
  forceMod: 8,
  wireframe: false,
  renderBoundaries: false,
  renderVelocities: true,
  renderForces: false,
  renderEulerPoles: false,
  renderLatLongLines: false,
  renderPlateLabels: true,
  flatShading: false,
  // Smaller number (16-64) will make topo scale less smooth and look closer to a real topographic map.
  // Large values (128-256) will smooth out the rendering.
  topoColormapShades: 256,
  // Shows extended version of the cross-section with separate rock layers.
  rockLayers: true,
  bumpMapping: true,
  sidebar: [
    "interactions",
    "timestep",
    "colormap",
    "earthquakes",
    "volcanicEruptions",
    "metamorphism",
    "latLongLines",
    "plateLabels",
    "velocityArrows",
    "forceArrows",
    "eulerPoles",
    "boundaries",
    "wireframe",
    "save"
  ],
  // Voronoi sphere is used by the grid model and defines quality of the collision detection. It shouldn't be changed
  // in the real model. It's useful to decrease this value in tests that don't care about precision, as the model will
  // be initialized way faster. `undefined` value means that model will use a preferred value based on the grid size.
  voronoiSphereFieldsCount: undefined,
  // show/hide key (hidden by default)
  key: false,
  // Show a time counter that displays model time in million years.
  timeCounter: false,
  get crossSectionMinElevation() {
    return this.subductionMinElevation * 0.7;
  },
  // Options useful for debugging or model development.
  debug: false, // Adds features specific for debugging or model development, e.g. plates visibility toggle
  debugCrossSection: false,
  benchmark: false,
  markCrossSectionFields: false
};

const urlConfig: Record<string, any> = {};

function isArray(value: any) {
  return typeof value === "string" && value.match(/^\[.*\]$/);
}

Object.keys(DEFAULT_CONFIG).forEach((key) => {
  const urlValue = getURLParam(key);
  if (urlValue === true || urlValue === "true") {
    urlConfig[key] = true;
  } else if (urlValue === "false") {
    urlConfig[key] = false;
  } else if (urlValue !== null && isArray(urlValue)) {
    // Array can be provided in URL using following format:
    // &parameter=[value1,value2,value3]
    if (urlValue === "[]") {
      urlConfig[key] = [];
    } else {
      urlConfig[key] = urlValue.substring(1, urlValue.length - 1).split(",");
    }
  } else if (urlValue !== null && !isNaN(Number(urlValue))) {
    // !isNaN(string) means isNumber(string).
    urlConfig[key] = parseFloat(urlValue);
  } else if (urlValue !== null) {
    urlConfig[key] = urlValue;
  }
});

const finalConfig: Record<string, any> = { ...DEFAULT_CONFIG, ...urlConfig };
export default finalConfig;
