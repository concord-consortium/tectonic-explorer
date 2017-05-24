import { getURLParam } from './utils';

const DEFAULT_CONFIG = {
  playing: true,
  divisions: 32,
  integration: 'rk4',
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
  bumpMapping: false, // experimental, not polished yet
  oceanDensity: 1,
  continentDensity: 3
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
