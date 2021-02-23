import { getNewQuaternions, getNewVelocities } from "./helpers";

export default function eulerStep(model: any, timestep: any) {
  const a = model.getAngularAccelerations();
  const v = model.getAngularVelocities();
  const q = model.getQuaternions();

  const vNew = getNewVelocities(model, v, a, timestep);
  const qNew = getNewQuaternions(model, q, vNew, timestep);
  model.setAngularVelocities(vNew);
  model.setQuaternions(qNew);
}
