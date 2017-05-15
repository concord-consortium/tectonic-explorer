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

const STEP_INTERVAL = 0.2; // s

export default class PlatesModel extends PureComponent {
  constructor(props) {
    super(props);
    this.rafHandler = this.rafHandler.bind(this);
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
    this.elapsedTime = 0;
    if (config.playing) this.rafHandler();
  }

  rafHandler() {
    window.requestAnimationFrame(this.rafHandler);
    this.elapsedTime += this.clock.getDelta();
    if (this.elapsedTime > STEP_INTERVAL) {
      this.step(STEP_INTERVAL);
      this.elapsedTime = 0;
    }
  }

  step(timestep) {
    this.model.step(timestep);
    this.view3d.update()
  }

  render() {
    return (
      <div className="plates-model">
        <Plates3DView ref={(c) => { this.view3d = c; }} width={width} height={height}/>
      </div>
    );
  }
}
