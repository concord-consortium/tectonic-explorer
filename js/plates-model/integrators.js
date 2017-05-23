export function euler(model, timestep) {
  model.plates.forEach(plate => plate.updateAcceleration());
  model.plates.forEach(plate => plate.updateVelocity(timestep));
  model.plates.forEach(plate => plate.updateRotation(timestep));

  model.plates.forEach(plate => plate.updateFields(timestep));
  model.simulatePlatesInteractions(timestep);
}

export function rk4(model, timestep, rotation = false) {
  const initialVelocity = {};
  const initialRotation = {};
  model.plates.forEach(plate => {
    initialVelocity[plate.id] = plate.angularVelocity.clone();
    initialRotation[plate.id] = plate.quaternion.clone();
  });
  const resetVelocity = () => {
    model.plates.forEach(plate => {
      plate.angularVelocity = initialVelocity[plate.id].clone();
    });
  };
  const resetRotation = () => {
    model.plates.forEach(plate => {
      plate.quaternion = initialRotation[plate.id].clone();
    });
  };

  const accelerations = [];
  const velocities = [];
  const save = () => {
    const acc = {};
    const vel = {};
    model.plates.forEach(plate => {
      acc[plate.id] = plate.angularAcceleration.clone();
      vel[plate.id] = plate.angularVelocity.clone();
    });
    accelerations.push(acc);
    velocities.push(vel);
  };

  // Step 1
  model.plates.forEach(plate => plate.updateAcceleration()); // a1
  save();

  // Step 2
  if (rotation) {
    model.plates.forEach(plate => plate.updateRotation(timestep * 0.5)); // x2 = x + 0.5 * v1 * dt
  }
  model.plates.forEach(plate => plate.updateVelocity(timestep * 0.5)); // v2 = v + 0.5 * a1 * dt
  model.plates.forEach(plate => plate.updateAcceleration()); // a2 = a(x2, v2)
  save();

  // Step 3
  if (rotation) {
    resetRotation(); // x3 = x
    model.plates.forEach(plate => plate.updateRotation(timestep * 0.5)); // x3 = x + 0.5 * v2 * dt
  }
  resetVelocity(); // v3 = v
  model.plates.forEach(plate => plate.updateVelocity(timestep * 0.5)); // v3 = v + 0.5 * a2 * dt
  model.plates.forEach(plate => plate.updateAcceleration()); // a3 = a(x3, v3)
  save();

  // Step 4
  if (rotation) {
    resetRotation(); // x4 = x
    model.plates.forEach(plate => plate.updateRotation(timestep * 0.5)); // x4 = x + v3 * dt
  }
  resetVelocity(); // v4 = v
  model.plates.forEach(plate => plate.updateVelocity(timestep)); // v4 = v + a3 * dt
  model.plates.forEach(plate => plate.updateAcceleration()); // a4 = a(x4, v4)
  save();

  // Final update
  resetRotation(); // xf = x
  resetVelocity(); // vf = v
  model.plates.forEach(plate => {
    const a1 = accelerations[0][plate.id];
    const a2 = accelerations[1][plate.id].multiplyScalar(2);
    const a3 = accelerations[2][plate.id].multiplyScalar(2);
    const a4 = accelerations[3][plate.id];
    const asum = a1.add(a2).add(a3).add(a4);
    plate.updateVelocity(timestep / 6, asum);

    if (rotation) {
      const v1 = velocities[0][plate.id];
      const v2 = velocities[1][plate.id].multiplyScalar(2);
      const v3 = velocities[2][plate.id].multiplyScalar(2);
      const v4 = velocities[3][plate.id];
      const vsum = v1.add(v2).add(v3).add(v4);
      plate.updateRotation(timestep / 6, vsum);
    } else {
      plate.updateRotation(timestep)
    }
  });

  model.plates.forEach(plate => plate.updateFields(timestep));
  model.simulatePlatesInteractions(timestep);
}

export function modifiedVerlet(model, timestep) {
  // acceleration = force(time, position, velocity) / mass;
  // position += timestep * (velocity + timestep * acceleration / 2);
  // velocity += timestep * acceleration;
  // newAcceleration = force(time, position, velocity) / mass;
  // velocity += timestep * (newAcceleration - acceleration) / 2;

  const accelerations = [];
  const save = () => {
    const acc = {};
    model.plates.forEach(plate => {
      acc[plate.id] = plate.angularAcceleration.clone();
    });
    accelerations.push(acc);
  };

  model.plates.forEach(plate => plate.updateAcceleration());
  save();
  model.plates.forEach(plate => plate.updateVelocity(timestep * 0.5));
  model.plates.forEach(plate => plate.updateRotation(timestep));
  model.plates.forEach(plate => plate.updateVelocity(timestep * 0.5));

  model.plates.forEach(plate => plate.updateFields(timestep));
  model.simulatePlatesInteractions(timestep);

  model.plates.forEach(plate => plate.updateAcceleration());
  save();

  model.plates.forEach(plate => {
    const a1 = accelerations[0][plate.id];
    const a2 = accelerations[1][plate.id];
    const asum = a2.sub(a1).multiplyScalar(0.5);
    plate.updateVelocity(timestep, asum);
  });
}