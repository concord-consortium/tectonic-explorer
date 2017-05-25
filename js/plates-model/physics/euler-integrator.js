import { get, set, getNewQuaternions, getNewVelocities } from './helpers';

export default function eulerStep(model, timestep) {
  const a = get(model, 'acceleration');
  const v = get(model, 'angularVelocity');
  const q = get(model, 'quaternion');

  const vNew = getNewVelocities(model, v, a, timestep);
  const qNew = getNewQuaternions(model, q, vNew, timestep);
  set(model, vNew, 'angularVelocity');
  set(model, qNew, 'quaternion');

  model.simulatePlatesInteractions(timestep);
}
