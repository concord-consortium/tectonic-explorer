import { getURLParam } from './utils';

const DEFAULT_CONFIG = {
  playing: true,
  divisions: 32,
  // There are three different integration methods: 'euler', 'verlet' and 'rk4'.
  // Good test case for physics engine: preset=continentalCollision1&constantBaseTorque=true
  // e.g. http://localhost:8080/?preset=continentalCollision1&renderForces=true&constantBaseTorque=true&integration=verlet
  // - It seems that the Verlet method provides best results so far (forces look pretty stable, model kinetic energy too).
  // - RK4 is more complicated and actually kinetic energy of the model grows faster than in Verlet method. It might
  //   be a bug in the implementation, as RK4 method should provide the best results theoretically.
  // - Euler is the simplest, but also the worst - forces tend to oscillate and kinetic energy grows fast, it quickly
  //   becomes visible in the model.
  // It all becomes less important when constantBaseTorque=false, as after some time there are no forces and plates
  // will stop themselves due to light friction / drag force.
  integration: 'verlet',
  // By default base torque applied to plates is decreased with time and default friction is really small,
  // so plates drift for a long time. When this option is set to true, base torque won't be changed at all
  // and base friction will be much higher. It's useful for testing various integration methods with
  // continentalCollision1 model.
  constantBaseTorque: false,
  // Use Voronoi sphere instead of kd-tree, faster, less accurate, but probably not important for the simulation.
  optimizedCollisions: true,
  // Density affects plate's inertia tensor.
  oceanDensity: 1,
  continentDensity: 3,
  // Rendering:
  wireframe: false,
  renderPlates: true,
  renderAdjacentFields: false,
  renderModelGrid: false,
  renderCollisions: false,
  renderVelocities: true,
  renderForces: false,
  renderEulerPoles: true,
  bumpMapping: true, // experimental, not polished yet
};

const urlConfig = {};

Object.keys(DEFAULT_CONFIG).forEach((key) => {
  const urlValue = getURLParam(key);
  if (urlValue === 'true') {
    urlConfig[key] = true;
  } else if (urlValue === 'false') {
    urlConfig[key] = false;
  } else if (urlValue !== null && !isNaN(urlValue)) {
    // !isNaN(string) means isNumber(string).
    urlConfig[key] = parseFloat(urlValue);
  } else if (urlValue !== null) {
    urlConfig[key] = urlValue;
  }
});

const finalConfig = Object.assign({}, DEFAULT_CONFIG, urlConfig);
export default finalConfig;
