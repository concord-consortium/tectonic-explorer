import { getNewVelocities, getNewQuaternions, updateAngularVelocity, integrateRotationQuaternion } from "./helpers";

// Flag indicating whether quaternions should be integrated using rk4 method or not.
// Results seem similar in both cases.
const RK4_QUATERNIONS = true;

// 4th order Runge-Kutta integration method. E.g. see:
// http://mtdevans.com/2013/05/fourth-order-runge-kutta-algorithm-in-javascript-with-demo/
export default function rk4Step(model: any, timestep: any) {
  // Save initial velocities and quaternions.
  const v1 = model.getAngularVelocities();
  const q1 = model.getQuaternions();

  // Step 1
  // a1 = a(x1, v1)
  const a1 = model.getAngularAccelerations();

  // Step 2
  // v2 = v1 + a1 * dt * 0.5
  const v2 = getNewVelocities(model, v1, a1, timestep * 0.5);
  model.setAngularVelocities(v2);
  if (RK4_QUATERNIONS) {
    // x2 = x1 + v1 * dt * 0.5
    const q2 = getNewQuaternions(model, q1, v1, timestep * 0.5);
    model.setQuaternions(q2);
  }
  // a2 = a(x2, v2)
  const a2 = model.getAngularAccelerations();

  // Step 3
  // v3 = v1 + a2 * dt * 0.5
  const v3 = getNewVelocities(model, v1, a2, timestep * 0.5);
  model.setAngularVelocities(v3);
  if (RK4_QUATERNIONS) {
    // x3 = x1 + v2 * dt * 0.5
    const q3 = getNewQuaternions(model, q1, v2, timestep * 0.5);
    model.setQuaternions(q3);
  }
  // a3 = a(x3, v3)
  const a3 = model.getAngularAccelerations();

  // Step 4
  // v4 = v1 + a3 * dt
  const v4 = getNewVelocities(model, v1, a3, timestep);
  model.setAngularVelocities(v4);
  if (RK4_QUATERNIONS) {
    // x4 = x1 + v3 * dt
    const q4 = getNewQuaternions(model, q1, v3, timestep);
    model.setQuaternions(q4);
  }
  // a4 = a(x4, v4)
  const a4 = model.getAngularAccelerations();

  // Final update
  model.forEachPlate((p: any) => {
    const a1v = a1.get(p);
    const a2v = a2.get(p).multiplyScalar(2);
    const a3v = a3.get(p).multiplyScalar(2);
    const a4v = a4.get(p);
    const aSum = a1v.add(a2v).add(a3v).add(a4v);
    p.angularVelocity = updateAngularVelocity(v1.get(p), aSum, timestep / 6);

    if (RK4_QUATERNIONS) {
      const v1v = v1.get(p);
      const v2v = v2.get(p).multiplyScalar(2);
      const v3v = v3.get(p).multiplyScalar(2);
      const v4v = v4.get(p);
      const vSum = v1v.add(v2v).add(v3v).add(v4v);
      p.quaternion = integrateRotationQuaternion(q1.get(p), vSum, timestep / 6);
    } else {
      p.quaternion = integrateRotationQuaternion(q1.get(p), v1.get(p), timestep);
    }
  });
}
