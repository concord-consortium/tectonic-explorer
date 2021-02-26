import Model from "../model";
import { getNewVelocities, getNewQuaternions, updateAngularVelocity } from "./helpers";

// Modified Velocity-Verlet algorithm that works with velocity-dependent forces. See:
// https://gamedev.stackexchange.com/a/41917
// acceleration = force(time, position, velocity) / mass
// position += timestep * (velocity +  acceleration * timestep * 0.5)
// velocity += timestep * acceleration
// newAcceleration = force(time, position, velocity) / mass
// velocity += timestep * (newAcceleration - acceleration) * 0.5
export default function verletStep(model: Model, timestep: number) {
  const v1 = model.getAngularVelocities();
  const q1 = model.getQuaternions();
  const a1 = model.getAngularAccelerations();

  const v2Half = getNewVelocities(model, v1, a1, timestep * 0.5);
  const q2 = getNewQuaternions(model, q1, v2Half, timestep);
  const v2 = getNewVelocities(model, v1, a1, timestep);

  model.setAngularVelocities(v2);
  model.setQuaternions(q2);
  const a2 = model.getAngularAccelerations();

  model.forEachPlate((p: any) => {
    const a1v = a1.get(p);
    const a2v = a2.get(p);
    const aDiff = a2v.sub(a1v).multiplyScalar(0.5);
    p.angularVelocity = updateAngularVelocity(v2.get(p), aDiff, timestep * 0.5);
  });
}
