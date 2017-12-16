import { getURLParam } from './utils'

const DEFAULT_CONFIG = {
  // Authoring mode that lets user pick a planet layout and put continents on them.
  // Usually it is overwritten using URL param: planetWizard=true.
  planetWizard: false,
  planetWizardSteps: ['presets', 'continents', 'forces', 'densities'],
  // One of the cases defined in presets.js file that will be loaded automatically.
  // Usually it is overwritten using URL param: preset=subduction.
  preset: '',
  // The identifier of a model stored in Firebase that will be loaded automatically.
  modelId: '',
  playing: true,
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
  integration: 'verlet',
  // By default hot spot torque applied to plates is decreased with time and default friction is really small,
  // so plates drift for a long time. When this option is set to true, hot spot torque won't be changed at all
  // and base friction will be much higher. It affects model behaviour quite a lot.
  // It's also useful for testing various integration methods with continentalCollision1 model.
  constantHotSpots: false,
  // Use Voronoi sphere instead of KD-tree, faster, less accurate, but probably not important for the simulation.
  optimizedCollisions: true,
  // Smoothing of cross section data. At this moment mainly affects oceanic floor and subducting areas.
  smoothCrossSection: true,
  // Density affects plate's inertia tensor.
  oceanDensity: 1,
  continentDensity: 3,
  // How fast continent is stretching along divergent boundary. Bigger value means it would turn into ocean / see faster.
  continentalStretchingRatio: 3,
  // Max length of the cross section line
  maxCrossSectionLength: 4000, // km
  // Horizontal scaling of cross section data.
  crossSectionPxPerKm: 0.2, // px per km
  // Default range of elevation is [0, 1] (the deepest trench, the highest mountain). However subducting plates go
  // deeper and this variable sets the proportion between this depth and normal topography.
  subductionMinElevation: -3.3,
  oceanicRidgeElevation: 0.47,
  oceanicRidgeWidth:650, // km
  // Width of the area around continent which acts as it's bumper / buffer. When this area is about to subduct,
  // drag forces will be applied to stop relative motion of the plates and prevent subduction of the neighbouring continent.
  continentBufferWidth: 750,
  // Keeps model running. When all the plates reach the point when they move in the same direction, with the same speed,
  // model will add some random forces and divide big plates (see minSizeRatioForDivision).
  enforceRelativeMotion: true,
  // Divide plates that occupy more than X of the planet area.
  minSizeRatioForDivision: 0.65,
  // Rendering:
  colormap: 'topo', // 'topo' or 'plate'
  // Defines interaction that can be selected using top bar.
  selectableInteractions: [ 'crossSection', 'force', 'none' ],
  wireframe: false,
  renderBoundaries: false,
  renderVelocities: true,
  renderForces: false,
  renderEulerPoles: false,
  renderLatLongLines: false,
  crossSection3d: true,
  bumpMapping: true,
  debugCrossSection: false,
  benchmark: false,
  sidebar: [
    'interactions',
    'timestep',
    'colormap',
    'latLongLines',
    'velocityArrows',
    'forceArrows',
    'eulerPoles',
    'boundaries',
    'wireframe',
    'save'
  ]
}

const urlConfig = {}

function isArray (value) {
  return typeof value === 'string' && value.match(/^\[.*\]$/)
}

Object.keys(DEFAULT_CONFIG).forEach((key) => {
  const urlValue = getURLParam(key)
  if (urlValue === true || urlValue === 'true') {
    urlConfig[key] = true
  } else if (urlValue === 'false') {
    urlConfig[key] = false
  } else if (isArray(urlValue)) {
    // Array can be provided in URL using following format:
    // &parameter=[value1,value2,value3]
    if (urlValue === '[]') {
      urlConfig[key] = []
    } else {
      urlConfig[key] = urlValue.substring(1, urlValue.length - 1).split(',')
    }
  } else if (urlValue !== null && !isNaN(urlValue)) {
    // !isNaN(string) means isNumber(string).
    urlConfig[key] = parseFloat(urlValue)
  } else if (urlValue !== null) {
    urlConfig[key] = urlValue
  }
})

const finalConfig = Object.assign({}, DEFAULT_CONFIG, urlConfig)
export default finalConfig
