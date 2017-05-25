import { get, set, getNewVelocities, getNewQuaternions, updateAngularVelocity, integrateRotationQuaternion } from './helpers';

// 4th order Runge-Kutta integration method. E.g. see:
// http://mtdevans.com/2013/05/fourth-order-runge-kutta-algorithm-in-javascript-with-demo/
export default function rk4Step(model, timestep) {
  // Save initial velocities and quaternions.
  const v1 = get(model, 'angularVelocity');
  const q1 = get(model, 'quaternion');

  // Step 1
  // a1 = a(x1, v1)
  const a1 = get(model, 'acceleration');

  // Step 2
  // x2 = x1 + v1 * dt * 0.5
  const q2 = getNewQuaternions(model, q1, v1, timestep * 0.5);
  // v2 = v1 + a1 * dt * 0.5
  const v2 = getNewVelocities(model, v1, a1, timestep * 0.5);
  // a2 = a(x2, v2)
  set(model, q2, 'quaternion');
  set(model, v2, 'angularVelocity');
  const a2 = get(model, 'acceleration');

  // Step 3
  // x3 = x1 + v2 * dt * 0.5
  const q3 = getNewQuaternions(model, q1, v2, timestep * 0.5);
  // v3 = v1 + a2 * dt * 0.5
  const v3 = getNewVelocities(model, v1, a2, timestep * 0.5);
  // a3 = a(x3, v3)
  set(model, q3, 'quaternion');
  set(model, v3, 'angularVelocity');
  const a3 = get(model, 'acceleration');

  // Step 4
  // x4 = x1 + v3 * dt
  const q4 = getNewQuaternions(model, q1, v3, timestep);
  // v4 = v1 + a3 * dt
  const v4 = getNewVelocities(model, v1, a3, timestep);
  // a4 = a(x4, v4)
  set(model, q4, 'quaternion');
  set(model, v4, 'angularVelocity');
  const a4 = get(model, 'acceleration');

  // Final update
  model.forEachPlate(p => {
    const a1v = a1.get(p);
    const a2v = a2.get(p).multiplyScalar(2);
    const a3v = a3.get(p).multiplyScalar(2);
    const a4v = a4.get(p);
    const aSum = a1v.add(a2v).add(a3v).add(a4v);
    p.angularVelocity = updateAngularVelocity(v1.get(p), aSum, timestep / 6);

    const v1v = v1.get(p);
    const v2v = v2.get(p).multiplyScalar(2);
    const v3v = v3.get(p).multiplyScalar(2);
    const v4v = v4.get(p);
    const vSum = v1v.add(v2v).add(v3v).add(v4v);
    p.quaternion = integrateRotationQuaternion(q1.get(p), vSum, timestep / 6);
  });

  model.simulatePlatesInteractions(timestep);
}
