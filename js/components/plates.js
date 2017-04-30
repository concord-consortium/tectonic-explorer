import React, { PureComponent } from 'react';
import Plates3DView from './plates-3d-view';
import Model from '../plates-model/model';
import { getURLParam, getImageData } from '../utils';
import * as THREE from 'three';
import config from '../config';

import '../../css/plates-model.less';

const width = window.innerWidth;
const height = window.innerHeight;

const MODEL_SPEED = 60;
const SLOW_STEP_EVERY = 0.1; // s

export default class PlatesModel extends PureComponent {
  constructor(props) {
    super(props);
    this.step = this.step.bind(this);
  }

  componentDidMount() {
    const preset = getURLParam('preset') || 'data/test1.png';
    getImageData(preset, imgData => {
      this.setupModel({imgData});
    });
  }

  setupModel(preset) {
    window.m = this.model = new Model(preset);
    this.view3d.setModel(this.model);
    this.clock = new THREE.Clock();
    this.clock.start();
    this.elapsedTimeSinceSlowStep = 0;
    if (config.playing) this.step();
  }

  step() {
    window.requestAnimationFrame(this.step);
    const delta = this.clock.getDelta();
    this.fastStep(delta);
    this.elapsedTimeSinceSlowStep += delta;
    if (this.elapsedTimeSinceSlowStep > SLOW_STEP_EVERY) {
      this.slowStep(this.elapsedTimeSinceSlowStep);
      this.elapsedTimeSinceSlowStep = 0;
    }
  }

  fastStep(delta) {
    this.model.rotatePlates(delta * MODEL_SPEED);
    this.view3d.updateRotations();
  }

  slowStep() {
    this.model.simulatePlatesInteractions();
    this.view3d.updateColors();
  }

  render() {
    return (
      <div className="plates-model">
        <Plates3DView ref={(c) => { this.view3d = c; }} width={width} height={height}/>
      </div>
    );
  }
}
