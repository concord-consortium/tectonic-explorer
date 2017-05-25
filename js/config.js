import { getURLParam } from './utils';

const DEFAULT_CONFIG = {
  playing: true,
  divisions: 32,
  integration: 'euler',
  useGridMapping: false,
  wireframe: false,
  optimizedCollisions: true,
  renderPlates: true,
  renderAdjacentFields: false,
  renderModelGrid: false,
  renderCollisions: false,
  renderVelocities: true,
  renderForces: false,
  renderEulerPoles: true,
  bumpMapping: true, // experimental, not polished yet
  oceanDensity: 1,
  continentDensity: 3,
  // By default base torque applied to plates is decreased with time and default friction is really small,
  // so plates drift for a long time. When this option is set to true, base torque won't be changed at all
  // and base friction will be much higher. It's useful for testing various integration methods with
  // continentalCollision1 model.
  constantBaseTorque: false,
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
