import { get, set, getNewVelocities, getNewQuaternions, updateAngularVelocity } from './helpers';

// Modified Velocity-Verlet algorithm that works with velocity-dependent forces. See:
// https://gamedev.stackexchange.com/a/41917
// acceleration = force(time, position, velocity) / mass
// position += timestep * (velocity +  acceleration * timestep * 0.5)
// velocity += timestep * acceleration
// newAcceleration = force(time, position, velocity) / mass
// velocity += timestep * (newAcceleration - acceleration) * 0.5
export default function verletStep(model, timestep) {
  const v1 = get(model, 'angularVelocity');
  const q1 = get(model, 'quaternion');
  const a1 = get(model, 'acceleration');

  const v2Half = getNewVelocities(model, v1, a1, timestep * 0.5);
  const q2 = getNewQuaternions(model, q1, v2Half, timestep);
  const v2 = getNewVelocities(model, v1, a1, timestep);

  set(model, q2, 'quaternion');
  set(model, v2, 'angularVelocity');
  const a2 = get(model, 'acceleration');

  model.forEachPlate(p => {
    const a1v = a1.get(p);
    const a2v = a2.get(p);
    const aDiff = a2v.sub(a1v).multiplyScalar(0.5);
    p.angularVelocity = updateAngularVelocity(v2.get(p), aDiff, timestep * 0.5);
  });
}
