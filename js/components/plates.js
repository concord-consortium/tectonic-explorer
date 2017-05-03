import React, { PureComponent } from 'react';
import Plates3DView from './plates-3d-view';
import Model from '../plates-model/model';
import { getURLParam, getImageData } from '../utils';
import * as THREE from 'three';
import config from '../config';
import presets from '../presets';

import '../../css/plates-model.less';

const width = window.innerWidth;
const height = window.innerHeight;

const MODEL_SPEED = 1;
const SLOW_STEP_EVERY = 0.1; // s

export default class PlatesModel extends PureComponent {
  constructor(props) {
    super(props);
    this.step = this.step.bind(this);
  }

  componentDidMount() {
    const presetName = getURLParam('preset') || 'two-plates';
    const preset = presets[presetName];
    getImageData(preset.img, imgData => {
      this.setupModel(imgData, preset.init);
    });
  }

  setupModel(imgData, initFunction) {
    window.m = this.model = new Model(imgData, initFunction);
    this.view3d.setModel(this.model);
    this.clock = new THREE.Clock();
    this.clock.start();
    this.elapsedTimeSinceSlowStep = 0;
    if (config.playing) this.step();
  }

  step() {
    window.requestAnimationFrame(this.step);
    const timestep = Math.min(0.1, this.clock.getDelta()) * MODEL_SPEED; // limit timestep to 0.1s
    this.fastStep(timestep);
    this.elapsedTimeSinceSlowStep += timestep;
    if (this.elapsedTimeSinceSlowStep > SLOW_STEP_EVERY) {
      this.slowStep(this.elapsedTimeSinceSlowStep);
      this.elapsedTimeSinceSlowStep = 0;
    }
  }

  fastStep(timestep) {
    this.model.rotatePlates(timestep);
    this.view3d.updateRotations();
  }

  slowStep(timestep) {
    this.model.simulatePlatesInteractions(timestep);
    this.view3d.update();
  }

  render() {
    return (
      <div className="plates-model">
        <Plates3DView ref={(c) => { this.view3d = c; }} width={width} height={height}/>
      </div>
    );
  }
}
